import winston, { createLogger } from 'winston'

export const logger = createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format(info => ({
          ...info,

          alloc_id: process.env.NOMAD_ALLOC_ID,
          job_name: process.env.NOMAD_JOB_NAME,
          job_id: process.env.NOMAD_JOB_ID,
          task_name: process.env.NOMAD_TASK_NAME,          
          datacenter_name: process.env.NOMAD_DC

        })),
        winston.format.json()
      ),
      handleExceptions: true
    }),
  ],
})
