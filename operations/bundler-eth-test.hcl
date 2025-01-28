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
        entrypoint = ["node"]
        # command = "run"
        args = ["operations/scripts/bundler-eth-test.mjs"]
      }

      vault {
        policies = ["dashboard-stage"]
      }

      template {
        data = <<-EOH
        {{with secret "kv/valid-ator/stage"}}
          BUNDLER_CONTROLLER_KEY="{{.Data.data.DISTRIBUTION_OPERATOR_KEY}}"
        {{end}}
        EOH
        destination = "secrets/file.env"
        env         = true
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
