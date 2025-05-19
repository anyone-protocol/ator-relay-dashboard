job "deploy-relay-dashboard-stage" {
  datacenters = [ "ator-fin" ]
  namespace = "ator-network"
  type = "batch"

  reschedule { attempts = 0 }

  task "deploy-relay-dashboard-stage-task" {
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
      logging {
        type = "loki"
        config {
          loki-url = "http://10.1.244.1:3100/loki/api/v1/push"
          loki-external-labels = "container_name={{.Name}},job_name=${NOMAD_JOB_NAME}"
        }
      }
    }

    env {
      PHASE="stage"
      DASHBOARD_VERSION="[[.commit_sha]]"
    }

    vault { policies = [ "dashboard-stage" ] }

    template {
      data = <<-EOH
      NUXT_PUBLIC_OPERATOR_REGISTRY_PROCESS_ID="[[ consulKey "smart-contracts/stage/operator-registry-address" ]]"
      NUXT_PUBLIC_RELAY_REWARDS_PROCESS_ID="[[ consulKey "smart-contracts/stage/relay-rewards-address" ]]"
      NUXT_PUBLIC_METRICS_DEPLOYER="[[ consulKey "valid-ator/stage/validator-address-base64" ]]"
      NUXT_PUBLIC_FACILITATOR_CONTRACT="[[ consulKey "facilitator/sepolia/stage/address" ]]"
      NUXT_PUBLIC_SEPOLIA_ATOR_TOKEN_CONTRACT="[[ consulKey "ator-token/sepolia/stage/address" ]]"
      NUXT_PUBLIC_REGISTRATOR_CONTRACT="[[ consulKey "registrator/sepolia/stage/address" ]]"
      {{ with secret "kv/dashboard/stage" }}
      NUXT_PUBLIC_SUPPORT_WALLET_PUBLIC_KEY_BASE64 = "{{ .Data.data.SUPPORT_ADDRESS_BASE64 }}"
      PERMAWEB_KEY="{{ .Data.data.DASHBOARD_OWNER_KEY }}"
      {{ end }}
      {{ with secret "kv/dashboard/stage/cloudflare" }}
      DEPLOY_BUCKET="{{ .Data.data.DEPLOY_BUCKET }}"
      {{ end }}
      EOH
      destination = "secrets/file.env"
      env         = true
    }

    template {
      data = <<-EOF
      {{ with secret "kv/dashboard/stage/cloudflare" }}[r2]
      type = s3
      provider = Cloudflare
      region = auto
      endpoint = {{ .Data.data.ENDPOINT }}
      access_key_id = {{ .Data.data.ACCESS_KEY_ID }}
      secret_access_key = {{ .Data.data.SECRET_ACCESS_KEY }}
      {{ end }}
      EOF
      destination = "secrets/rclone.conf"
    }

    template {
      data = <<-EOF
      #!/bin/sh

      echo "Generating static files"
      pnpm run generate

      echo "Syncing static files to cloudflare r2: ${DEPLOY_BUCKET}"
      rclone sync .output/public r2:${DEPLOY_BUCKET}/

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
