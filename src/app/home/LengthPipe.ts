import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'length'
})
export class LengthPipe implements PipeTransform {
    private times = ['s', 'min', 'h', 'd'];

    transform(value: any, ...args: any[]): any {
        const array = this.calcNextTimePeriod(Math.round(value));
        let result = '';
        let j = 0;
        for (let i = array.length - 1; i >= 0; i--) {
            result = array[i] + this.times[j++] + ' ' + result;
        }
        return result.substring(0, result.length - 1);
    }

    private calcNextTimePeriod(time: number, lastResult: number[] = []): number[] {
        const rest = time % 60;
        const nextTime = (time - rest) / 60;
        if (nextTime > 59) {
            return this.calcNextTimePeriod(nextTime, [rest].concat(lastResult));
        }
        const endRest = nextTime > 0 ? [nextTime, rest] : [rest];
        return endRest.concat(lastResult);
    }
}