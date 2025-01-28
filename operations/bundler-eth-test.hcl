job "bundler-eth-test-dev" {
  datacenters = ["ator-fin"]
  namespace = "ator-network"
  type = "batch"

  reschedule {
    attempts = 0
  }

    task "bundler-eth-test-task" {
      driver = "docker"

      config {
        image = "ghcr.io/anyone-protocol/ator-relay-dashboard:519a3fa4d33928e2bfb0c066010148ef93fb50f3"
        force_pull = true
        entrypoint = ["node"]
        # command = "run"
        args = ["operations/scripts/bundler-eth-test.mjs"]
      }

      vault {
        policies = ["valid-ator-stage"]
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
