job "deploy-relay-dashboard-dev" {
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
            force_pull = true
            entrypoint = ["pnpm"]
            command = "run"
            args = ["deploy"]
        }

        vault {
            policies = ["dashboard-dev"]
        }

        template {
            data = <<EOH
            NUXT_PUBLIC_RELAY_REGISTRY_ADDRESS="[[ consulKey "smart-contracts/dev/relay-registry-address" ]]"
            NUXT_PUBLIC_METRICS_DEPLOYER="[[ consulKey "valid-ator/dev/validator-address-base64" ]]"
            NUXT_PUBLIC_DISTRIBUTION_CONTRACT="[[ consulKey "smart-contracts/dev/distribution-address" ]]"
            NUXT_PUBLIC_FACILITATOR_CONTRACT="[[ consulKey "facilitator/sepolia/dev/address" ]]"
            NUXT_PUBLIC_SEPOLIA_ATOR_TOKEN_CONTRACT="[[ consulKey "ator-token/sepolia/dev/address" ]]"
            NUXT_PUBLIC_WARP_GATEWAY = "https://dre-dev.ec.anyone.tech"
            NUXT_PUBLIC_SUPPORT_WALLET_PUBLIC_KEY_BASE64 = "{{.Data.data.SUPPORT_ADDRESS_BASE64}}"
            NUXT_PUBLIC_REGISTRATOR_CONTRACT="[[ consulKey "registrator/sepolia/dev/address" ]]"
            {{with secret "kv/dashboard/dev"}}
                PERMAWEB_KEY="{{.Data.data.DASHBOARD_OWNER_KEY}}"
            {{end}}
            EOH
            destination = "secrets/file.env"
            env         = true
        }
        
        env {
            PHASE="dev"
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
