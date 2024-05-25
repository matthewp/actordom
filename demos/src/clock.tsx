import { send, spawn, update } from 'actordom';

type HandOptions = {
  className: string;
  width: number;
  length: number;
  fixed?: boolean;
}

class Hand {
  className: string;
  width: number;
  length: number;
  fixed: boolean;
  rotate = '';
  constructor(opts: HandOptions){
    this.className = opts.className;
    this.width = opts.width;
    this.length = opts.length;
    this.fixed = !!opts.fixed;
  }
  receive([name, data]: ['tick', string]){
    switch(name) {
      case 'tick': {
        this.rotate = data;
        break;
      }
    }
    update(this);
  }
  view() {
    return (
      <line
        class={this.className}
        y1={this.fixed ? this.length - 95 : undefined}
        y2={-(this.fixed ? 95 : this.length)}
        stroke="currentColor"
        stroke-width={this.width}
        stroke-linecap="round"
        transform={this.rotate}
      />
    );
  }
}


const getSecondsSinceMidnight = (): number => (Date.now() - new Date().setHours(0, 0, 0, 0)) / 1000;
const rotate = (rotate: number, fixed: number = 1) => `rotate(${(rotate * 360).toFixed(fixed)})`;

const subsecond = (time: number) => rotate(time % 1);
const second = (time: number) => rotate((time % 60) / 60);
const minute = (time: number) => rotate(((time / 60) % 60) / 60);
const hour = (time: number) => rotate(((time / 60 / 60) % 12) / 12);

class Clock {
  hourHand = spawn(Hand, { className: 'hour', length: 50, width: 4 });
  minuteHand = spawn(Hand, { className: 'minute', length: 80, width: 3 });
  secondHand = spawn(Hand, { className: 'second', length: 80, width: 2 });
  subsecondHand = spawn(Hand, { className: 'subsecond', length: 85, width: 5 });
  constructor() {
    requestAnimationFrame(this.tick)
  }
  tick = () => {
    let now = getSecondsSinceMidnight();
    send(this.hourHand, ['tick', hour(now)]);
    send(this.minuteHand, ['tick', minute(now)]);
    send(this.secondHand, ['tick', second(now)]);
    send(this.subsecondHand, ['tick', subsecond(now)]);
    requestAnimationFrame(this.tick);
  };
  view() {
    return (
      <div class="clock">
        <svg viewBox="0 0 200 200" width="200px">
          <g transform="translate(100, 100)">
            {/* static */}
            <circle class="text-neutral-900" r="99" fill="white" stroke="currentColor" />
    {/*         <Lines numberOfLines={60} class="subsecond" length={2} width={1} />
            <Lines numberOfLines={12} class="hour" length={5} width={2} /> */}
            {/* dynamic */}
    {/*         <Hand rotate={props.subsecond} class="subsecond" length={85} width={5} />
            <Hand rotate={props.hour} class="hour" length={50} width={4} />
            <Hand rotate={props.minute} class="minute" length={70} width={3} /> */}
            {this.subsecondHand}
            {this.hourHand}
            {this.minuteHand}
            {this.secondHand}
          </g>
        </svg>
      </div>
    )
  }
}

export {
  Clock
}