import { pipeline as pipe, Readable } from 'stream';
import * as through2 from 'through2';
import { promisify } from 'util';

const pipeline = promisify(pipe);
const logger = console;


const wait = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const readableFromArray = (items: any[]) => {
    return new Readable({
        objectMode: true,
        read() {
            items.forEach((item) => {
                this.push(item);
            });
            this.push(null);
        }
    })
};

const print = () => {
    return through2.obj(
        (item: any, _enc: any, cb: any) => {
            logger.log(item);
            cb(null, item);
        }
    );
};

const sayOnFlush = (text: string, { waitTime }: { waitTime: number }) => {
    return through2.obj(
        (_item: any, _enc: any, cb: any) => {
            // Confirm all.
            cb();
        },
        async(cb: any) => {
            logger.info('(Prepare to flush)', text)
            await wait(waitTime);
            logger.info('(Flush)', text);
            cb();
        }
    )
};

async function main() {
    logger.info('Start');
    const s1 = readableFromArray(new Array(20).fill(0).map((_, id) => ({ id })));
    const s2 = print();
    const s3 = sayOnFlush('Finished (A)', { waitTime: 500 })
    const s4 = sayOnFlush('Finished (B)', { waitTime: 1000 });
    await pipeline(s1, s2, s3, s4);
    // Why is `End` logged earlier than `(Flush) Finished (B)`?
    logger.info('End');
}
main();