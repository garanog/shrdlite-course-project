///<reference path="Graph.ts"/>
///<reference path="World.ts"/>

class StateNode {
    constructor(
        public state : WorldState,
        public action? : string
    ) {}

    compareTo(other : StateNode) : number {
    for(var key in this.state.objects) {
        if(!((other.state.objects[key] === this.state.objects[key]))) {
            return 1;
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
          // Get the last element of the stack the arm's over and put it in the holding property
          newState.holding = newState.stacks[newState.arm][newState.stacks[newState.arm].length-1];
          // Remove the last element from said stack
          newState.stacks[newState.arm].pop;
          var newNode : StateNode = new StateNode(newState, "p");
          outgoing.push({from: node, to: newNode, cost:1});
        }

        // Case d - if holding anything and the physical rules are observed when dropping that object
        if(node.state.holding != null && this.checkPhysics(node.state, node.state.holding, node.state.stacks[node.state.arm][node.state.stacks[node.state.arm].length-1])) {
          var newState = this.stateDeepCopy(node.state);
          // Put the element held in the arm on the stack it is currently over
          newState.stacks[newState.arm].push(newState.holding);
          newState.holding = null;
          var newNode : StateNode = new StateNode(newState, "d");
          outgoing.push({from: node, to: newNode, cost:1});
        }

        return outgoing;
    }

    checkPhysics (state: WorldState, a: string, b: string): boolean {
      let objectA = state.objects[a];

      //TODO: is the floor really large?
      let objectB = b == "floor" ? {color:null, size:"large", form:"floor"} : state.objects[b];

      if (objectB.form == "ball") return false;
      if (objectA.size == "large" && objectB.size == "small") return false;
      if (objectA.form == "ball" && (objectB.form != "floor" && objectB.form != "box" )) return false;

      return true;
    }

    stateDeepCopy(state : WorldState) : WorldState {
      var newState : WorldState;

      for(let stack in state.stacks) {
        newState.stacks.push([]);
        for(let stackElement of stack){
          newState.stacks[stack].push(stackElement);
        }
      }
      //newState.stacks = state.stacks;
      newState.holding = state.holding;
      newState.arm = state.arm;
      newState.objects = state.objects; // Not deep copy, but not necesary
      newState.examples = state.examples; // Not deep copy, but not necesary

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
