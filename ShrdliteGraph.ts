///<reference path="Graph.ts"/>
///<reference path="World.ts"/>

class StateNode {
    constructor(
        public state : WorldState,
        public action? : string
    ) {}

    compareTo(other : StateNode) : number {
    if(this.state.stacks.length != other.state.stacks.length){
        return 1;
    }

    for(var i: number = 0; i < this.state.stacks.length; i++){
        var otherStack: string[]  = other.state.stacks[i];
        var thisStack: string[] = this.state.stacks[i];
        if(otherStack.length != thisStack.length){
            return 1;
        }
        for(var j: number = 0; j < thisStack.length; ++j){
        var thisObject: ObjectDefinition = this.state.objects[thisStack[j]];
        var otherObject: ObjectDefinition = other.state.objects[otherStack[j]];
        if(!(thisObject.form === otherObject.form &&
            thisObject.size === otherObject.size &&
            thisObject.color === otherObject.color)) {
                return 1;
            }
        }
    }
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
        let retV: string; 
        if(start){
            retV += "start: " + start.toString() + "\n";
        }
        if( path ){
            retV += "path: ";
            for(var node in path){
                retV += node.toString() + " ";
            }
            retV += "\n";
        }
        retV += "outgoingEdges: ";
        for(var node in this.outgoingEdges){
            retV += (node);
        }
        retV += "\n";
        return retV;
    }
}
