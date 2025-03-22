job "deploy-relay-dashboard-live" {
    datacenters = ["ator-fin"]
    namespace = "ator-network"
    type = "batch"

    reschedule {
        attempts = 0
    }

    task "deploy-relay-dashboard-task" {
        driver = "docker"

        config {
            image = "ghcr.io/anyone-protocol/ator-relay-dashboard:[[.commit_sha]]"
            entrypoint = ["pnpm"]
            image_pull_timeout = "15m"
            command = "run"
            args = ["deploy"]
            logging {
                type = "loki"
                config {
                loki-url = "http://10.1.244.1:3100/loki/api/v1/push"
                loki-external-labels = "container_name={{.Name}},job_name=${NOMAD_JOB_NAME}"
                }
            }
        }

        vault {
            policies = ["dashboard-live"]
        }

        template {
            data = <<-EOH
            NUXT_PUBLIC_OPERATOR_REGISTRY_PROCESS_ID="[[ consulKey "smart-contracts/live/operator-registry-address" ]]"
            NUXT_PUBLIC_RELAY_REWARDS_PROCESS_ID="[[ consulKey "smart-contracts/live/relay-rewards-address" ]]"
            NUXT_PUBLIC_METRICS_DEPLOYER="[[ consulKey "valid-ator/live/validator-address-base64" ]]"
            NUXT_PUBLIC_FACILITATOR_CONTRACT="[[ consulKey "facilitator/sepolia/live/address" ]]"
            NUXT_PUBLIC_SEPOLIA_ATOR_TOKEN_CONTRACT="[[ consulKey "ator-token/sepolia/live/address" ]]"
            NUXT_PUBLIC_SUPPORT_WALLET_PUBLIC_KEY_BASE64 = "{{.Data.data.SUPPORT_ADDRESS_BASE64}}"
            NUXT_PUBLIC_REGISTRATOR_CONTRACT="[[ consulKey "registrator/sepolia/live/address" ]]"
            {{with secret "kv/dashboard/live"}}
                PERMAWEB_KEY="{{.Data.data.DASHBOARD_OWNER_KEY}}"
            {{end}}
            EOH
            destination = "secrets/file.env"
            env         = true
        }

        env {
            PHASE="live"
            DASHBOARD_VERSION="[[.commit_sha]]"
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
