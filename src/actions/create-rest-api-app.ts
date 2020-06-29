import express from 'express';
import { forEach, reduce } from 'lodash';
import { createManager, Manager } from 'conveyor-mq';

interface RedisConfig {
  host: string;
  port: number;
}

export const createRestApiApp = ({
  queues,
}: {
  queues: {
    name: string;
    redisConfig: RedisConfig;
  }[];
}) => {
  const expressApp = express();
  const managerByQueue: {
    [key: string]: Manager;
  } = reduce(
    queues,
    (acc, curr) => {
      return {
        ...acc,
        [curr.name]: createManager({
          queue: curr.name,
          redisConfig: curr.redisConfig,
        }),
      };
    },
    {},
  );
  forEach(queues, (queueConfig) => {
    expressApp.get(
      `/queues/${queueConfig.name}/task-counts`,
      async (req, res) => {
        const manager = managerByQueue[queueConfig.name];
        const counts = await manager.getTaskCounts();
        res.json(counts);
      },
    );
  });
  return expressApp;
};
