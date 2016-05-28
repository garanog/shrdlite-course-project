///<reference path="Graph.ts"/>
///<reference path="World.ts"/>


class StateNode {
    constructor(
        public state : WorldState,
        public action? : string
    ) {}


    compareTo(other : StateNode) : number {
      if(this.state.stacks.length != other.state.stacks.length ||
          this.state.holding != other.state.holding ||
          this.state.arm != other.state.arm) {
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
      return 0;
    }

    toString() : string {
        return "(" + worldStateString(this.state) + ")";
    }
}

class AWorldState implements WorldState {
  /** The stack of objects in each column, given as a list of
   * stacks. Each stack is a list of strings. The strings themselves
   * are keys into the `objects` map, i.e. identifiers. */
  stacks: Stack[];
  /** Which object the robot is currently holding. */
  holding: string;
  /** The column position of the robot arm. */
  arm: number;
  /** A mapping from strings to `ObjectDefinition`s. The strings are meant to be identifiers for the objects (see ExampleWorlds.ts for an example). */
  objects: { [s:string]: ObjectDefinition; };
  /** List of predefined example sentences/utterances that the user can choose from in the UI. */
  examples: string[];
}

class ShrdliteGraph implements Graph<StateNode> {

    outgoingEdges(node : StateNode) : Edge<StateNode>[] {
        var outgoing : Edge<StateNode>[] = [];

        // Case r
        if(node.state.arm < node.state.stacks.length - 1) {
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
          newState.stacks[newState.arm].pop();
          var newNode : StateNode = new StateNode(newState, "p");
          outgoing.push({from: node, to: newNode, cost:1});
        }

        // Case d - if holding anything and the physical rules are observed when dropping that object
        var armStack = node.state.stacks[node.state.arm];
        var topObject : string = armStack.length == 0 ?
          "floor" : armStack[armStack.length - 1];

        if (node.state.holding != null &&
          this.checkPhysics(node.state, node.state.holding, topObject)) {
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
      let objectB = (b == "floor") ?
        {color:null, size:"large", form:"floor"} : state.objects[b];

      if (objectB.form == "ball") return false;
      if (objectA.size == "large" && objectB.size == "small") return false;
      if (objectA.form == "ball" && (objectB.form != "floor" && objectB.form != "box" )) return false;

      return true;
    }


    stateDeepCopy(state : WorldState) : WorldState {
      var newState : WorldState = new AWorldState() ;
      newState.stacks = new Array<string[]>();

      for(let stack = 0; stack < state.stacks.length; stack++) {
        newState.stacks.push(new Array<string>());
        for(let stackElement of state.stacks[stack]){
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
