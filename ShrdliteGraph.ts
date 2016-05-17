///<reference path="Graph.ts"/>

class StateNode {
    constructor(
        public state : WorldState,
        public action? : string
    ) {}

    compareTo(other : StateNode) : number {
        return 0; //TODO implement
    }

    toString() : string {
        return "(" + this.state + ")";
    }
}


class ShrdliteGraph implements Graph<StateNode> {

    outgoingEdges(node : StateNode) : Edge<StateNode>[] {
        var outgoing : Edge<StateNode>[] = [];

        // r l p d
        //TODO: create the up to four nodes, check whether states are possible.

        return outgoing;
    }

    compareNodes(a : StateNode, b : StateNode) : number {
        return a.compareTo(b);
    }

    toString(start? : StateNode, goal? : (n:StateNode) => boolean, path? : StateNode[]) : string {
        return "Graph."; //TODO
    }
}
