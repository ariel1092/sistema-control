import { performance } from 'perf_hooks';
import { addTime } from './performance.storage';

const operationsToTrack = [
  'count',
  'countDocuments',
  'estimatedDocumentCount',
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'findOneAndRemove',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
  'aggregate',
  'save',
  'insertMany',
  'bulkWrite',
];

export function mongoosePerformancePlugin(schema: any) {
  operationsToTrack.forEach((op) => {
    schema.pre(op, function preHook() {
      (this as any).__perfStart = performance.now();
    });

    schema.post(op, function postHook() {
      const start = (this as any).__perfStart as number | undefined;
      if (typeof start === 'number') {
        addTime('db', performance.now() - start);
      }
    });
  });
}

