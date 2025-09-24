job "deploy-relay-dashboard-live" {
  datacenters = [ "ator-fin" ]
  type = "batch"
  namespace = "live-protocol"

  constraint {
    attribute = "${meta.pool}"
    value = "live-protocol"
  }

  reschedule { attempts = 0 }

  group "deploy-relay-dashboard-live-group" {
    count = 1

    task "deploy-relay-dashboard-live-task" {
      driver = "docker"

      consul {}

      vault {
        role = "any1-nomad-workloads-controller"
      }

      config {
        image = "ghcr.io/anyone-protocol/ator-relay-dashboard:[[.commit_sha]]"
        image_pull_timeout = "45m"
        entrypoint = [ "/usr/src/app/entrypoint.sh" ]
        mount {
          type = "bind"
          source = "secrets/rclone.conf"
          target = "/root/.config/rclone/rclone.conf"
          readonly = true
        }
        mount {
          type = "bind"
          source = "local/entrypoint.sh"
          target = "/usr/src/app/entrypoint.sh"
          readonly = true
        }
        mount {
          type = "bind"
          target = "/etc/ssl/certs/vault-ca.crt"
          source = "/opt/nomad/tls/vault-ca.crt"
          readonly = true
          bind_options {
            propagation = "private"
          }
        }
        logging {
          type = "loki"
          config {
            loki-url = "${LOKI_URL}"
            loki-external-labels = "container_name={{.Name}},job_name=${NOMAD_JOB_NAME}"
          }
        }
      }

      env {
        PHASE="live"
        NODE_OPTIONS="--max-old-space-size=4096"
        DASHBOARD_VERSION="[[.commit_sha]]"
        BUMP="0"
        # Remove once CU includes our processes
        NUXT_PUBLIC_AO_CU_URL="https://cu.ardrive.io"
      }

      template {
        data = <<-EOH
        {{- range service "loki" }}
        LOKI_URL="http://{{ .Address }}:{{ .Port }}/loki/api/v1/push"
        {{- end }}
        EOH
        destination = "local/config.env"
        env         = true
      }

      template {
        data = <<-EOH
        NUXT_PUBLIC_OPERATOR_REGISTRY_PROCESS_ID="{{ key "smart-contracts/live/operator-registry-address" }}"
        NUXT_PUBLIC_RELAY_REWARDS_PROCESS_ID="{{ key "smart-contracts/live/relay-rewards-address" }}"
        NUXT_PUBLIC_STAKING_REWARDS_PROCESS_ID="{{ key "smart-contracts/live/staking-rewards-address" }}"
        NUXT_PUBLIC_METRICS_DEPLOYER="{{ key "valid-ator/live/validator-address-base64" }}"
        NUXT_PUBLIC_FACILITATOR_CONTRACT="{{ key "facilitator/sepolia/live/address" }}"
        NUXT_PUBLIC_HODLER_CONTRACT="{{ key "hodler/sepolia/live/address" }}"
        NUXT_PUBLIC_SEPOLIA_ATOR_TOKEN_CONTRACT="{{ key "ator-token/sepolia/live/address" }}"
        NUXT_PUBLIC_REGISTRATOR_CONTRACT="{{ key "registrator/sepolia/live/address" }}"
        {{ with secret "kv/live-protocol/deploy-relay-dashboard-live" }}
        NUXT_PUBLIC_SUPPORT_WALLET_PUBLIC_KEY_BASE64 = "{{ .Data.data.SUPPORT_ADDRESS_BASE64 }}"
        PERMAWEB_KEY="{{ .Data.data.DASHBOARD_OWNER_KEY }}"
        NUXT_PUBLIC_STAKING_SNAPSHOT_CONTROLLER="{{ .Data.data.STAKING_REWARDS_CONTROLLER_ADDRESS_ARWEAVE }}"
        {{ end }}
        EOH
        destination = "secrets/file.env"
        env         = true
      }

      template {
        data = <<-EOF
        {{ with secret "kv/live-protocol/deploy-relay-dashboard-live" }}[r2]
        type = s3
        provider = Cloudflare
        region = auto
        endpoint = {{ .Data.data.CLOUDFLARE_ENDPOINT }}
        access_key_id = {{ .Data.data.CLOUDFLARE_ACCESS_KEY_ID }}
        secret_access_key = {{ .Data.data.CLOUDFLARE_SECRET_ACCESS_KEY }}
        {{ end }}
        EOF
        destination = "secrets/rclone.conf"
      }

      template {
        data = <<-EOF
        #!/bin/sh

        echo "Generating static files"
        pnpm run generate

        {{ with secret "kv/live-protocol/deploy-relay-dashboard-live" }}
        echo "Syncing static files to cloudflare r2: {{ .Data.data.CLOUDFLARE_DEPLOY_BUCKET }}"
        rclone sync .output/public r2:{{ .Data.data.CLOUDFLARE_DEPLOY_BUCKET }}/
        {{ end }}

        echo "Publishing static files to Arweave"
        pnpm run deploy:arweave
        EOF
        destination = "local/entrypoint.sh"
        perms = "0755"
      }

      restart {
        attempts = 0
        mode = "fail"
      }

      resources {
        cpu    = 4096
        memory = 4096
      }
    }
  }
}
