export interface ITask<T> {
    run: () => Promise<T> | T;
}

export class TaskRunner {
    private tasks: { task: ITask<any>, resolve: (result: any) => any, reject: (error: any) => any }[];
    private running = false;

    public addTask<T>(task: ITask<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.tasks.push({task, resolve, reject});
            if (!this.running) {
                this.run();
            }
        });
    }

    public async run() {
        this.running = true;
        while (this.tasks.length > 0) {
            const task = this.tasks.shift();
            try {
                const result = await task.task.run();
                task.resolve(result);
            } catch (e) {
                task.reject(e);
            }
        }
        this.running = false;
    }
}