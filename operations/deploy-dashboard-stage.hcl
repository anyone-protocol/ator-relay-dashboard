job "deploy-relay-dashboard-stage" {
    datacenters = ["ator-fin"]
    namespace = "ator-network"
    type = "batch"

    reschedule {
        attempts = 0
    }

    task "deploy-relay-dashboard-task" {
        driver = "docker"

        config {
            image = "ghcr.io/anyone-protocol/ator-relay-dashboard:[[.deploy]]"
            force_pull = true
            entrypoint = ["pnpm"]
            command = "run"
            args = ["deploy"]
        }

        vault {
            policies = ["dashboard-stage"]
        }

        template {
            data = <<EOH
            NUXT_PUBLIC_RELAY_REGISTRY_ADDRESS="[[ consulKey "smart-contracts/stage/relay-registry-address" ]]"
            NUXT_PUBLIC_METRICS_DEPLOYER="[[ consulKey "valid-ator/stage/validator-address-base64" ]]"
            NUXT_PUBLIC_DISTRIBUTION_CONTRACT="[[ consulKey "smart-contracts/stage/distribution-address" ]]"
            NUXT_PUBLIC_FACILITATOR_CONTRACT="[[ consulKey "facilitator/sepolia/stage/address" ]]"
            NUXT_PUBLIC_SEPOLIA_ATOR_TOKEN_CONTRACT="[[ consulKey "ator-token/sepolia/stage/address" ]]"
            NUXT_PUBLIC_WARP_GATEWAY = "https://dre-stage.ec.anyone.tech"
            NUXT_PUBLIC_REGISTRATOR_CONTRACT="[[ consulKey "registrator/sepolia/stage/address" ]]"
            {{with secret "kv/dashboard/stage"}}
                PERMAWEB_KEY="{{.Data.data.DASHBOARD_OWNER_KEY}}"
                NUXT_PUBLIC_SUPPORT_WALLET_PUBLIC_KEY_BASE64 = "{{.Data.data.SUPPORT_ADDRESS_BASE64}}"
            {{end}}
            EOH
            destination = "secrets/file.env"
            env         = true
        }
        
        env {
            PHASE="stage"
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
