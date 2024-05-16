job "deploy-dashboard-dev" {
    datacenters = ["ator-fin"]
    type = "batch"

    reschedule {
        attempts = 0
    }

    task "deploy-dashboard-task" {
        driver = "docker"

        config {
            image = "ghcr.io/ator-development/ator-relay-dashboard:[[.deploy]]"
            force_pull = true
            entrypoint = ["pnpm"]
            command = "run deploy"
            args = []
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
            NUXT_PUBLIC_SUPPORT_WALLET_PUBLIC_KEY_BASE64 = "{{.Data.data.SUPPORT_ADDRESS_BASE64}}"
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