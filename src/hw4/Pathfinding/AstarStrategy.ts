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

export default class AstarStrategy extends NavPathStrat {

    /**
     * @see NavPathStrat.buildPath()
     */
    public buildPath(to: Vec2, from: Vec2): NavigationPath {
        let openSet: Set<Node> = new Set();
        let closedSet: Set<Node> = new Set();
        let start = new Node(from, null, 0, this.getH(from, to));
        let end = new Node(to);

        openSet.add(start);
        while(openSet.size > 0) {
            let current = this.getNodeOfMinF(openSet);
            if(Math.abs(current.position.x - end.position.x) < 8 && Math.abs(current.position.y - end.position.y) < 8) {
                let path = new Stack<Vec2>(10000);
                let cursor = current;
                while(cursor !== null) {
                    path.push(cursor.position);
                    cursor = cursor.parent;
                }
                return new NavigationPath(path);
            }

            openSet.delete(current);
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
                for(let p of openSet) {
                    if(Math.abs(p.position.x - n.position.x) < 8 && Math.abs(p.position.y - n.position.y) < 8) {
                        has = true;
                    }
                }
                if(!has) {
                    openSet.add(n);
                }else if(tempG >= n.g) {
                    continue;
                }
                n.parent = current;
                n.g = tempG;
                n.h = this.getH(n.position, end.position)
                n.f = n.g + n.h;
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
            new Vec2(0, -8), // Up
            new Vec2(0, 8),  // Down
            new Vec2(-8, 0), // Left
            new Vec2(8, 0),  // Right
            new Vec2(-8, -8),// Up-Left
            new Vec2(8, -8), // Up-Right
            new Vec2(-8, 8), // Down-Left
            new Vec2(8, 8)   // Down-Right
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