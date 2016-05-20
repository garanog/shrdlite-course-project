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

        // Case r
        if(node.state.arm < node.state.stacks.length) {
          var newState = this.stateDeepCopy(node.state);
          newState.arm = newState.arm + 1;
          var newNode : StateNode = new StateNode(newState, "r");
          outgoing.push({from: node, to: newNode, cost:1});
        }

        // Case l
        if(node.state.arm > 0) {
          var newState = this.stateDeepCopy(node.state);
          newState.arm = newState.arm - 1;
          var newNode : StateNode = new StateNode(newState, "l");
          outgoing.push({from: node, to: newNode, cost:1});
        }

        // Case p - if not holding anything and there is something to pick up
        if(node.state.holding == null && node.state.stacks[node.state.arm].length > 0) {
          var newState = this.stateDeepCopy(node.state);
          // TODO Make modifications
          var newNode : StateNode = new StateNode(newState, "p");
          outgoing.push({from: node, to: newNode, cost:1});
        }

        // Case d - if holding anything and the physical rules are observed when dropping that object
        if(node.state.holding != null && node.state.stacks[node.state.arm].length > 0) {
          var newState = this.stateDeepCopy(node.state);
          // TODO Make modifications
          var newNode : StateNode = new StateNode(newState, "d");
          outgoing.push({from: node, to: newNode, cost:1});
        }
        
        return outgoing;
    }

    stateDeepCopy(state : WorldState) : WorldState {
      var newState : WorldState;
      newState.stacks = state.stacks;
      newState.holding = state.holding;
      newState.arm = state.arm;
      newState.objects = state.objects;
      newState.examples = state.examples;

      return newState;
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