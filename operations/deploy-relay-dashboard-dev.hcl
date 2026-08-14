job "deploy-relay-dashboard-dev" {
  datacenters = [ "ator-fin" ]
  type = "batch"
  namespace = "dev-protocol"

  constraint {
    attribute = "${meta.pool}"
    value = "dev"
  }

  reschedule { attempts = 0 }

  group "deploy-relay-dashboard-dev-group" {
    count = 1

    task "deploy-relay-dashboard-dev-task" {
      driver = "docker"

      config {
        image = "ghcr.io/anyone-protocol/ator-relay-dashboard:[[.commit_sha]]"
        image_pull_timeout = "15m"
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
        PHASE="dev"
        DASHBOARD_VERSION="[[.commit_sha]]"
        # Deliberately hb-STAGE, not hb-dev: the template below reads the `smart-contracts/stage/*`
        # Consul keys, so those PIDs only exist on the stage node. Pointing this at hb-dev would
        # ask a node to compute processes it has never seen.
        NUXT_PUBLIC_HYPERBEAM_URL="https://hb-stage.anyone.tech"
      }

      vault {
        role = "any1-nomad-workloads-controller"
      }

      identity {
        name = "vault_default"
        aud  = ["any1-infra"]
        ttl  = "1h"
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
        # Dev runs against the STAGE contracts (see the hyperbeam URL note above). See the stage
        # jobspec for why these carry `_HYPERBEAM_`.
        NUXT_PUBLIC_OPERATOR_REGISTRY_HYPERBEAM_PROCESS_ID="{{ key "smart-contracts/stage/operator-registry-address" }}"
        NUXT_PUBLIC_RELAY_REWARDS_HYPERBEAM_PROCESS_ID="{{ key "smart-contracts/stage/relay-rewards-address" }}"
        # Was MISSING entirely, so the staking page silently fell back to whatever nuxt.config.ts
        # happened to carry rather than to what is actually deployed.
        NUXT_PUBLIC_STAKING_REWARDS_HYPERBEAM_PROCESS_ID="{{ key "smart-contracts/stage/staking-rewards-address" }}"
        NUXT_PUBLIC_METRICS_DEPLOYER="{{ key "valid-ator/stage/validator-address-base64" }}"
        NUXT_PUBLIC_FACILITATOR_CONTRACT="{{ key "facilitator/sepolia/stage/address" }}"
        NUXT_PUBLIC_SEPOLIA_ATOR_TOKEN_CONTRACT="{{ key "ator-token/sepolia/stage/address" }}"
        NUXT_PUBLIC_REGISTRATOR_CONTRACT="{{ key "registrator/sepolia/stage/address" }}"
        {{ with secret "kv/dev-protocol/deploy-relay-dashboard-dev" }}
        NUXT_PUBLIC_SUPPORT_WALLET_PUBLIC_KEY_BASE64 = "{{ .Data.data.SUPPORT_ADDRESS_BASE64 }}"
        PERMAWEB_KEY="{{ .Data.data.DASHBOARD_OWNER_KEY }}"
        {{ end }}
        EOH
        destination = "secrets/file.env"
        env         = true
      }

      template {
        data = <<-EOF
        {{ with secret "kv/dev-protocol/deploy-relay-dashboard-dev" }}[r2]
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

        {{ with secret "kv/dev-protocol/deploy-relay-dashboard-dev" }}
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
