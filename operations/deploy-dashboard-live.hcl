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
            image_pull_timeout = "10m"
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
            data = <<EOH
            NUXT_PUBLIC_RELAY_REGISTRY_ADDRESS="[[ consulKey "smart-contracts/live/relay-registry-address" ]]"
            NUXT_PUBLIC_METRICS_DEPLOYER="[[ consulKey "valid-ator/live/validator-address-base64" ]]"
            NUXT_PUBLIC_DISTRIBUTION_CONTRACT="[[ consulKey "smart-contracts/live/distribution-address" ]]"
            NUXT_PUBLIC_FACILITATOR_CONTRACT="[[ consulKey "facilitator/sepolia/live/address" ]]"
            NUXT_PUBLIC_SEPOLIA_ATOR_TOKEN_CONTRACT="[[ consulKey "ator-token/sepolia/live/address" ]]"
            NUXT_PUBLIC_WARP_GATEWAY = "https://dre.ec.anyone.tech"
            NUXT_PUBLIC_REGISTRATOR_CONTRACT="[[ consulKey "registrator/sepolia/live/address" ]]"
            {{with secret "kv/dashboard/live"}}
                PERMAWEB_KEY="{{.Data.data.DASHBOARD_OWNER_KEY}}"
                NUXT_PUBLIC_SUPPORT_WALLET_PUBLIC_KEY_BASE64 = "{{.Data.data.SUPPORT_ADDRESS_BASE64}}"
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
