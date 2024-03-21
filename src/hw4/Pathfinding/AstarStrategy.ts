import Stack from "../../Wolfie2D/DataTypes/Collections/Stack";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import NavigationPath from "../../Wolfie2D/Pathfinding/NavigationPath";
import NavPathStrat from "../../Wolfie2D/Pathfinding/Strategies/NavigationStrategy";
import GraphUtils from "../../Wolfie2D/Utils/GraphUtils";

// TODO Construct a NavigationPath object using A*

/**
 * The AstarStrategy class is an extension of the abstract NavPathStrategy class. For our navigation system, you can
 * now specify and define your own pathfinding strategy. Originally, the two options were to use Djikstras or a
 * direct (point A -> point B) strategy. The only way to change how the pathfinding was done was by hard-coding things
 * into the classes associated with the navigation system. 
 * 
 * - Peter
 */

class Node {
    public position: Vec2;
    public parent: Node | null;
    public g: number;
    public h: number;
    public f: number;

    constructor(position: Vec2, parent: Node | null = null, g: number = 0, h: number = 0) {
        this.position = position;
        this.parent = parent;
        this.g = g;
        this.h = h;
        this.f = g + h;
    }
}

class BHeap {
    nodes: Node[];

    constructor() {
        this.nodes = [];
    }

    enqueue(node: Node) {
        this.nodes.push(node);
        let i = this.nodes.length - 1;
        while(i > 0) {
            let parent = Math.floor((i - 1) / 2);
            if(this.nodes[i].f < this.nodes[parent].f) {
                [this.nodes[i], this.nodes[parent]] = [this.nodes[parent], this.nodes[i]];
                i = parent;
            }else {
                break;
            }
        }
    }

    dequeue(): Node {
        const min = this.nodes[0];
        const last = this.nodes.pop();
        if(this.nodes.length > 0 && last !== undefined) {
            this.nodes[0] = last;
            let i = 0;
            while(true) {
                let leftChild = 2 * i + 1;
                let rightChild = 2 * i + 2;
                let temp = null;
                if(leftChild < this.nodes.length) {
                    if(this.nodes[leftChild].f < this.nodes[i].f) {
                        temp = leftChild;
                    }
                }
                if(rightChild < this.nodes.length) {
                    if((temp === null && this.nodes[rightChild].f < this.nodes[i].f) || 
                        (temp !== null && this.nodes[rightChild].f < this.nodes[leftChild].f)) {
                        temp = rightChild;
                    }
                }
                if(temp === null)
                    break;
                [this.nodes[i], this.nodes[temp]] = [this.nodes[temp], this.nodes[i]];
                i = temp;
            }
        }
        return min;
    }

    isEmpty(): boolean {
        return this.nodes.length === 0;
    }
}

export default class AstarStrategy extends NavPathStrat {

    /**
     * @see NavPathStrat.buildPath()
     */
    public buildPath(to: Vec2, from: Vec2): NavigationPath {
        let open: BHeap = new BHeap();
        let closedSet: Set<Node> = new Set();
        let start = new Node(from, null, 0, this.getH(from, to));
        let end = new Node(to);

        open.enqueue(start);
        while(!open.isEmpty()) {
            let current = open.dequeue();
            if(Math.abs(current.position.x - end.position.x) < 8 && Math.abs(current.position.y - end.position.y) < 8) {
                let path = new Stack<Vec2>(1000);
                let cursor = current;
                while(cursor !== null) {
                    path.push(cursor.position);
                    cursor = cursor.parent;
                }
                return new NavigationPath(path);
            }

            closedSet.add(current);

            for(let n of this.getNeighbors(current, end)) {
                let has = false;
                for(let p of closedSet) {
                    if(Math.abs(p.position.x - n.position.x) < 8 && Math.abs(p.position.y - n.position.y) < 8) {
                        has = true;
                        break;
                    }
                }
                if(has)
                    continue;
                let tempG = current.g + current.position.distanceTo(n.position);
                has = false;
                for(let p of open.nodes) {
                    if(Math.abs(p.position.x - n.position.x) < 8 && Math.abs(p.position.y - n.position.y) < 8) {
                        has = true;
                    }
                }
                if(!has || tempG < n.g) {
                    n.parent = current;
                    n.g = tempG;
                    n.h = this.getH(n.position, end.position)
                    n.f = n.g + n.h;
                    open.enqueue(n);
                }
            }
        }

        return new NavigationPath(new Stack());
    }

    protected getH(from: Vec2, to: Vec2): number {
        return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
    }
    
    protected getNodeOfMinF(s: Set<Node>): Node | null {
        let minN: Node | null = null;
        let minF: number = Infinity;

        s.forEach(n => {
            if(n.f < minF) {
                minF = n.f;
                minN = n;
            }
        });

        return minN;
    }

    protected getNeighbors(n: Node, e: Node): Node[] {
        const directions = [
            new Vec2(0, -8),
            new Vec2(0, 8),
            new Vec2(-8, 0),
            new Vec2(8, 0),
        ]
        let neighbors: Node[] = [];
        
        let i = 0;
        directions.forEach(d => {
            let newP = new Vec2();
            newP.x = n.position.x + d.x;
            newP.y = n.position.y + d.y;
            let f = this.mesh.graph.snap(n.position);
            let s = this.mesh.graph.snap(newP);
            if(this.mesh.graph.getEdges(f) !== undefined && this.mesh.graph.edgeExists(f, s)) {
                neighbors.push(new Node(newP));
            }
            i++;
        });
        return neighbors;
    }
}