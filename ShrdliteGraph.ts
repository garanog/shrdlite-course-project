///<reference path="Graph.ts"/>

class StateNode {
    constructor(
        public state : WorldState,
        public action? : string
    ) {}

    compareTo(other : StateNode) : number {
        return 0; //TODO implement. compare each object in the world, return 1 once difference is found
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

        var rState : WorldState = node.state; //TODO deep copy state!
        rState.arm = rState.arm + 1;
        var r : StateNode = new StateNode(node.state, "r");
        if (true/*arm position is valid (compare to number of stacks?)*/)
          outgoing.push({
            from: node,
            to: r, cost: 1}
          );

        return outgoing;
    }

    compareNodes(a : StateNode, b : StateNode) : number {
        return a.compareTo(b);
    }

    toString(start? : StateNode, goal? : (n:StateNode) => boolean, path? : StateNode[]) : string {
        return "Graph."; //TODO
    }
}
