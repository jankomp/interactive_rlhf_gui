export class Path2D {
    constructor() {
        this._ = [];
        this._m = undefined;
    }
    moveTo(x, y) {
        this._.push(new Line([x, y], [x, y]));
        this._m = [x, y];
    }
    lineTo(x, y) {
        this._.push(new Line(this._m, this._m = [x, y]));
    }
    bezierCurveTo(ax, ay, bx, by, x, y) {
        this._.push(new BezierCurve(this._m, [ax, ay], [bx, by], this._m = [x, y]));
    }
    *split(k = 0) {
        const n = this._.length;
        const i = Math.floor(n / 2);
        const j = Math.ceil(n / 2);
        const a = new Path2D();
        a._ = this._.slice(0, i);
        const b = new Path2D();
        b._ = this._.slice(j);

        if (i !== j) {
            const segment = this._[i];
            if (segment && typeof segment.split === 'function') {
                const [ab, ba] = segment.split();
                a._.push(ab);
                b._.unshift(ba);
            } else {
                console.error("Segment does not have a split method:", segment);
            }
        }

        if (k > 1) {
            yield* a.split(k - 1);
            yield* b.split(k - 1);
        } else {
            yield a;
            yield b;
        }
    }
    toString() {
        return this._.map(segment => segment.toString()).join("");
    }
}




class Line {
    constructor(a, b) {
        this.a = a;
        this.b = b;
    }
    split() {
        const { a, b } = this;
        const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        return [new Line(a, m), new Line(m, b)];
    }
    toString() {
        return `M${this.a}L${this.b}`;
    }
}

class BezierCurve {
    constructor(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }
    split() {
        const l1 = [4 / 8, 4 / 8, 0 / 8, 0 / 8];
        const l2 = [2 / 8, 4 / 8, 2 / 8, 0 / 8];
        const l3 = [1 / 8, 3 / 8, 3 / 8, 1 / 8];
        const r1 = [0 / 8, 2 / 8, 4 / 8, 2 / 8];
        const r2 = [0 / 8, 0 / 8, 4 / 8, 4 / 8];

        const dot = ([ka, kb, kc, kd], { a, b, c, d }) => [
            ka * a[0] + kb * b[0] + kc * c[0] + kd * d[0],
            ka * a[1] + kb * b[1] + kc * c[1] + kd * d[1],
        ];

        const m = dot(l3, this);
        return [
            new BezierCurve(this.a, dot(l1, this), dot(l2, this), m),
            new BezierCurve(m, dot(r1, this), dot(r2, this), this.d)
        ];
    }
    toString() {
        return `M${this.a}C${this.b},${this.c},${this.d}`;
    }
}