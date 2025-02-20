job "deploy-relay-dashboard-dev" {
  datacenters = ["ator-fin"]
  namespace = "ator-network"
  type = "batch"

  reschedule {
    attempts = 0
  }

  constraint {
    attribute = "${node.unique.id}"
    value = "89b957c9-560a-126e-1ae8-13277258fcf1"
  }

  task "deploy-relay-dashboard-task" {
    driver = "docker"

    config {
      image = "ghcr.io/anyone-protocol/ator-relay-dashboard:[[.commit_sha]]"
      force_pull = true
      image_pull_timeout = "10m"
      entrypoint = ["pnpm"]
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
      policies = ["dashboard-stage"]
    }

    template {
      data = <<-EOH
      NUXT_PUBLIC_OPERATOR_REGISTRY_PROCESS_ID="[[ consulKey "smart-contracts/stage/operator-registry-address" ]]"
      NUXT_PUBLIC_RELAY_REWARDS_PROCESS_ID="[[ consulKey "smart-contracts/stage/relay-rewards-address" ]]"
      NUXT_PUBLIC_METRICS_DEPLOYER="[[ consulKey "valid-ator/stage/validator-address-base64" ]]"
      NUXT_PUBLIC_FACILITATOR_CONTRACT="[[ consulKey "facilitator/sepolia/stage/address" ]]"
      NUXT_PUBLIC_SEPOLIA_ATOR_TOKEN_CONTRACT="[[ consulKey "ator-token/sepolia/stage/address" ]]"
      NUXT_PUBLIC_SUPPORT_WALLET_PUBLIC_KEY_BASE64 = "{{.Data.data.SUPPORT_ADDRESS_BASE64}}"
      NUXT_PUBLIC_REGISTRATOR_CONTRACT="[[ consulKey "registrator/sepolia/stage/address" ]]"
      {{with secret "kv/dashboard/stage"}}
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

  # task "promtail-task" {
  #   driver = "docker"
  #   config {
  #     image = "grafana/promtail:2.9.4"
  #     args = ["-config.file", "local/config.yaml", "-print-config-stderr", ]
  #   }

  #   resources {
  #     cpu    = 128
  #     memory = 256
  #   }

  #   template {
  #     data = <<-EOH
  #     server:
  #       disable: true

  #     positions:
  #       filename: {{ env `NOMAD_ALLOC_DIR` }}/positions.yaml

  #     client:
  #       url: http://10.1.244.1:3100/loki/api/v1/push

  #     scrape_configs:
  #       - job_name: local
  #         static_configs:
  #         - targets:
  #             - localhost
  #           labels:
  #             job: nomad
  #             __path__: "{{ env `NOMAD_ALLOC_DIR` }}/logs/deploy-relay-dashboard-task.stdout.0"
  #         pipeline_stages:
  #           # extract the fields from the JSON logs
  #           - json:
  #               expressions:
  #                 alloc_id: alloc_id
  #                 job_name: job_name
  #                 job_id: job_id
  #                 task_name: task_name
  #                 datacenter_name: datacenter_name
  #                 timestamp: timestamp
  #                 stack: stack
  #                 level: level
  #                 message: message
  #                 data: data
  #           # the following fields are used as labels and are indexed:
  #           - labels:
  #               job_name:
  #               task_name:
  #           - timestamp:
  #               source: timestamp
  #               format: RFC3339
  #     EOH
  #     destination = "local/config.yaml"
  #   }
  # }
}
