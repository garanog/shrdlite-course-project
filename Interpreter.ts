///<reference path="World.ts"/>
///<reference path="Parser.ts"/>
///<reference path="lib/collections.ts"/>

/**
* Interpreter module
*
* The goal of the Interpreter module is to interpret a sentence
* written by the user in the context of the current world state. In
* particular, it must figure out which objects in the world,
* i.e. which elements in the `objects` field of WorldState, correspond
* to the ones referred to in the sentence.
*
* Moreover, it has to derive what the intended goal state is and
* return it as a logical formula described in terms of literals, where
* each literal represents a relation among objects that should
* hold. For example, assuming a world state where "a" is a ball and
* "b" is a table, the command "put the ball on the table" can be
* interpreted as the literal ontop(a,b). More complex goals can be
* written using conjunctions and disjunctions of these literals.
*
* In general, the module can take a list of possible parses and return
* a list of possible interpretations, but the code to handle this has
* already been written for you. The only part you need to implement is
* the core interpretation function, namely `interpretCommand`, which produces a
* single interpretation for a single command.
*/
module Interpreter {

    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types

    /**
    Top-level function for the Interpreter. It calls `interpretCommand` for each
    * possible parse of the command. No need to change this one.
    * @param parses List of parses produced by the Parser.
    * @param currentState The current state of the world.
    * @returns Augments ParseResult with a list of interpretations. Each
    * interpretation is represented by a list of Literals.
    */
    export function interpret(parses : Parser.ParseResult[], currentState : WorldState) : InterpretationResult {
        var errors : Error[] = [];
        var commandInterpretations : CommandInterpretationResult[] = [];
        var questionInterpretations : QuestionInterpretationResult[] = [];
        var interpretationType : string;

        parses.forEach((parseresult) => {
            try {
                interpretationType = parseresult.parse.type;

                if (parseresult.parse.type == "command") {
                    let result: CommandInterpretationResult = <CommandInterpretationResult> parseresult;
                    result.interpretation = interpretCommand(result.parse.command, currentState);
                    commandInterpretations.push(result);
                } else if (parseresult.parse.type == "question") {
                    let result: QuestionInterpretationResult = <QuestionInterpretationResult> parseresult;
                    var interpretationResult = interpretQuestion(result.parse.question, currentState);
                    result.questionWord = interpretationResult[0];
                    result.interpretation = interpretationResult[1];
                    questionInterpretations.push(result);
                } else {
                  throw new Error("Unknown parseresult type. ");
                }
            } catch (err) {
                errors.push(err);
            }
        });

        if (commandInterpretations.length) {
            return ({type :"command",
              commandInterpretations : commandInterpretations});
        } else if (questionInterpretations.length) {
            return ({type : "question",
              questionInterpretations : questionInterpretations});
        } else {
            // only throw the first error found
            throw errors[0];
        }
    }

    export interface InterpretationResult {
      type: string; //question or command?
      commandInterpretations?: CommandInterpretationResult[];
      questionInterpretations?: QuestionInterpretationResult[];
    }

    export interface CommandInterpretationResult extends Parser.ParseResult {
        interpretation: DNFFormula;
    }

    export interface QuestionInterpretationResult extends Parser.ParseResult {
        questionWord: string;
        interpretation: string;
    }

    export type DNFFormula = Conjunction[];
    type Conjunction = Literal[];

    /**
    * A Literal represents a relation that is intended to
    * hold among some objects.
    */
    export interface Literal {
        /** Whether this literal asserts the relation should hold
         * (true polarity) or not (false polarity). For example, we
         * can specify that "a" should *not* be on top of "b" by the
         * literal {polarity: false, relation: "ontop", args:
         * ["a","b"]}.
         */
        polarity : boolean;
        /** The name of the relation in question. */
        relation : string;
        /** The arguments to the relation. Usually these will be either objects
         * or special strings such as "floor" or "floor-N" (where N is a column) */
        args : string[];
    }

    export function stringify(result: CommandInterpretationResult): string {
        return result.interpretation.map((literals) => {
            return literals.map((lit) => stringifyLiteral(lit)).join(" & ");
            // return literals.map(stringifyLiteral).join(" & ");
        }).join(" | ");
    }

    export function stringifyLiteral(lit: Literal): string {
        return (lit.polarity ? "" : "-") + lit.relation + "(" + lit.args.join(",") + ")";
    }

    function stringifyDNF(formula: DNFFormula): string {
      return formula.map((literals) => {
          return literals.map((lit) => stringifyLiteral(lit)).join(" & ");
          // return literals.map(stringifyLiteral).join(" & ");
      }).join(" | ");
    }

    //////////////////////////////////////////////////////////////////////
    // private functions

    // function interpretUtterance(utr: Parser.Utterance, state: WorldState): void{
    // }


    /**
     * The core interpretation function. Interprets a command, as it has been
     * parsed by the parser into a DNF formula representing the goal of the
     * command.
     * @param cmd The actual command. Note that it is *not* a string, but rather
     * an object of type `Command` (as it has been parsed by the parser).
     * @param state The current state of the world. Useful to look up objects in the world.
     * @returns A list of list of Literal, representing a formula in disjunctive normal form (disjunction of conjunctions). See the dummy interpetation returned in the code for an example, which means ontop(a,floor) AND holding(b).
     * @throws An error when no valid interpretations can be found
     */
    function interpretCommand(cmd: Parser.Command, state: WorldState): DNFFormula {
        switch(cmd.command) {
          case "move": // put, drop as well
            return interpretMoveCommand(cmd, state);
          case "take":
            return interpretTakeCommand(cmd, state);
          case "put":
            return interpretPutCommand(cmd, state);
        }
        return null;
    }

    /**
      TODO
    **/
    function interpretQuestion(question: Parser.Question, state: WorldState): [string, string] {
      switch (question.question) {
        case "where is":
          return interpretWhereIsQuestion(question, state);
        case "how many":
          return interpretHowManyQuestion(question, state);
      }
      return [null, null];
    }

    function interpretWhereIsQuestion(question: Parser.Question, state: WorldState): [string, string] {
      return [question.question, interpretEntity(question.entity, new collections.LinkedList<string>(), state).objectIds.elementAtIndex(0)];
        //TODO NOT TAKE ONLY THE FIRST ONE HERE and make it beautiful
    }

    function interpretHowManyQuestion(question: Parser.Question, state: WorldState): [string, string] {
      return [question.question, interpretObject(question.object, new collections.LinkedList<string>(), state).objectIds.size().toString()];
    }

    function interpretMoveCommand(cmd: Parser.Command, state: WorldState) : DNFFormula {
      let entityInterpretationResult = interpretEntity(cmd.entity, new collections.LinkedList<string>(), state);
      let setOfObjects = entityInterpretationResult.objectIds;
      let previouslySeenObjects = entityInterpretationResult.nestedObjectsIds;

      let relation = cmd.location.relation;

      let locationObjectsInterpretationResult = interpretEntity(cmd.location.entity,
        previouslySeenObjects, state);
      let setOfLocationObjects = locationObjectsInterpretationResult.objectIds;

      // Check for ambiguity depending on the specified quantifier
      if(cmd.entity.quantifier == "the" && setOfObjects.size() > 1) {
        throw "Ambiguous subject"
        // TODO Ask clarification question
      }

      if(cmd.location.entity.quantifier == "the" && setOfLocationObjects.size() > 1) {
        throw "Ambiguous location"
        // TODO Ask clarification question
      }
        
      if(cmd.entity.quantifier == "one" && setOfObjects.size() < 1){
        throw "There are no objects like that but you wanted to move one";
      }
      
      if(cmd.entity.quantifier == "two" && setOfObjects.size() < 2){
        throw "There are less than two objects that fit that discription";
        }  
    
      if(cmd.entity.quantifier == "all" && !(setOfLocationObjects.contains("floor") && setOfLocationObjects.size() <= state.stacks.length) && setOfLocationObjects.size() < setOfObjects.size()) {
        throw "More objects than locations"
      }
        
   
        
        return combineSetsToDNF(state, setOfObjects, relation, setOfLocationObjects, cmd.entity.quantifier);
      
    }

    function interpretTakeCommand(cmd: Parser.Command, state: WorldState) : DNFFormula {
      let setOfObjects = interpretEntity(cmd.entity, new collections.LinkedList<string>(), state).objectIds;
      let relation = "holding";

      if(cmd.entity.quantifier == "the" && setOfObjects.size() > 1) {
        throw "Ambiguous subject"
        // TODO Ask clarification question
      }

      return combineSetToDNF(setOfObjects, relation, cmd.entity.quantifier);
    }

    function interpretPutCommand(cmd: Parser.Command, state: WorldState) : DNFFormula {
      let setOfObjects: collections.LinkedList<string> = new collections.LinkedList<string>();
      setOfObjects.add(state.holding) ; //set containing only this
      let relation = cmd.location.relation;
      let setOfLocationObjects = interpretEntity(cmd.location.entity, new collections.LinkedList<string>(), state).objectIds;

      if(cmd.location.entity.quantifier == "the" && setOfLocationObjects.size() > 1) {
        throw "Ambiguous location"
        // TODO Ask clarification question
      }

      return combineSetsToDNF(state, setOfObjects, relation, setOfLocationObjects, "the");
    }

    function interpretEntity( entity: Parser.Entity,
                              previouslySeenObjects : collections.LinkedList<string>,
                              state : WorldState)
      : ObjectInterpretationResult {
      //TODO: interpret quantifier
        if(entity.quantifier == "two"){
            interpretManyObject(entity.object, previouslySeenObjects, state, 2);
        }
        else if(entity.quantifier == "three"){
        interpretManyObject(entity.object, previouslySeenObjects, state, 3);
            
        }
      return interpretObject(entity.object, previouslySeenObjects, state);
    }

    class ObjectInterpretationResult {
      objectIds : collections.LinkedList<string>;
      nestedObjectsIds : collections.LinkedList<string>;
        moves: number = 1;      
    }
    
    
    function interpretManyObject( entityObject: Parser.Object,
                              previouslySeenObjects : collections.LinkedList<string>,
                                  state: WorldState,
                                    moves: number
                                  )
                                  : ObjectInterpretationResult {
                let obj: ObjectInterpretationResult = interpretObject(entityObject, previouslySeenObjects, state);
                obj.moves = moves;
                return obj;
    }
    
    /*
    * Interprets the information given from the entityObject, and returns a list
    * of the keys to all objects from the world that matches that information.
    */
    function interpretObject( entityObject: Parser.Object,
                              previouslySeenObjects : collections.LinkedList<string>,
                                  state: WorldState
                                  )
        : ObjectInterpretationResult {
      let objectMap  : { [s:string]: ObjectDefinition; } = state.objects;
      let stacks : Stack[]= state.stacks;

      if (entityObject.location == null) {
        return interpretSimpleObject(entityObject, previouslySeenObjects, state);
      } else {
        return interpretComplexObject(entityObject, previouslySeenObjects, state);
      }
    }
    /*
    * Interprets the information given from the entityObject, and returns a list
    * of the keys to all objects from the world that matches that information.
    */
    function interpretTwoObjects( entityObject: Parser.Object,
                              previouslySeenObjects : collections.LinkedList<string>,
                              state: WorldState)
        : ObjectInterpretationResult {
      let objectMap  : { [s:string]: ObjectDefinition; } = state.objects;
      let stacks : Stack[]= state.stacks;

      if (entityObject.location == null) {
        return interpretSimpleObject(entityObject, previouslySeenObjects, state);
      } else {
        return interpretComplexObject(entityObject, previouslySeenObjects, state);
      }
    }


    /*
    * Interprets information about a "simple" parser-obejct.
    * A simple object contains information about the color, size and form of the
    * objects searched for. All objects that match the description will be found
    * by searching through all obects in the given worldstate and compared.
    */
    function interpretSimpleObject( entityObject : Parser.Object,
                                    previouslySeenObjects : collections.LinkedList<string>,
                                    state : WorldState)
                                  : ObjectInterpretationResult {
      let matchingSet : collections.LinkedList<string> =
          new collections.LinkedList<string>();
      let desiredSize  : string = entityObject.size;
      let desiredColor : string = entityObject.color;
      let desiredForm : string = entityObject.form;

      if (entityObject.form == "floor")
        matchingSet.add("floor");
      else {
        var desiredForms : string[] = interpretDesiredForm(desiredForm, desiredSize, desiredColor, previouslySeenObjects, state);

        for (let stack of state.stacks) {
          for (let objectName of stack) {
            let objectToCompare : ObjectDefinition = state.objects[objectName];
            if (objectMatchesDescription(objectToCompare, desiredSize, desiredColor, desiredForms))
              matchingSet.add(objectName);
          }
        }

        if (state.holding != null){
          let heldObject : ObjectDefinition = state.objects[state.holding];
          if (objectMatchesDescription(heldObject, desiredSize, desiredColor, desiredForms))
            matchingSet.add(state.holding);
        }
      }

      if (matchingSet.size() == 0)
        throw new Error("Could not find the " + Parser.describeObject(entityObject) + ".");

      return {objectIds: matchingSet, nestedObjectsIds: matchingSet, moves: 1};
    }

    function interpretDesiredForm(desiredForm : string,
                                  desiredSize : string,
                                  desiredColor : string,
                                  previouslySeenObjects : collections.LinkedList<string>,
                                  state: WorldState) : string[] {
      var desiredForms : string[] = [desiredForm];

      //Anaphoric references
      if (desiredForm == "one") {

        if (previouslySeenObjects.size() == 0)
          throw "You didn't mention anything before, I don't understand which object you mean by that anaphoric reference."

        desiredForms = [];
        for (var previouslySeenObjId of previouslySeenObjects.toArray()) {
          let previouslySeenObj = state.objects[previouslySeenObjId];
          if (desiredForms.indexOf(previouslySeenObj.form) == -1)
            desiredForms.push(previouslySeenObj.form);
        }
      }

      return desiredForms;
    }

    function objectMatchesDescription(obj : Parser.Object,
      desiredSize : string, desiredColor : string, desiredForms : string[]) : boolean {
        if (desiredSize != null && obj.size != desiredSize)
          return false;

        if (desiredColor != null && obj.color != desiredColor)
          return false;

        if (desiredForms.indexOf(obj.form) == -1 && desiredForms.indexOf("anyform") == -1)
          return false;

        return true;
    }

    /*
    * Interprets information about a "complex" parser-object.
    * A complex object contains information about a kind of object that is related to
    * another type of object, and will return a list of all obects that fits the
    * description and is correctly related to a object of the second type. It will
    * recursively find lists of all objects matching the given information, and check
    * which ones fulfills the relation.
    */
    function interpretComplexObject(entityObject : Parser.Object,
                                    previouslySeenObjects : collections.LinkedList<string>,
                                    state : WorldState) : ObjectInterpretationResult {
      let matchingSet : collections.LinkedList<string> =
          new collections.LinkedList<string>();

      let relatedMatchingSet : collections.LinkedList<string> =
          new collections.LinkedList<string>();

      let originalObjectsInterpretationResult : ObjectInterpretationResult
        = interpretObject(entityObject.object, previouslySeenObjects, state);
      let originalObjects : collections.LinkedList<string>
        = originalObjectsInterpretationResult.objectIds;

      let relatedSet : collections.LinkedList<string> =
        interpretEntity(entityObject.location.entity, previouslySeenObjects, state).objectIds;

      let relation : string = entityObject.location.relation;

      for (let originalObject of originalObjects.toArray()) {
        let correctlyPlacedOn : string = null;

        switch (relation) {
          case "ontop":
            correctlyPlacedOn = checkForCorrectPlace(onTopOf,state,originalObject,relatedSet);
            break;
          case "inside":
            correctlyPlacedOn = checkForCorrectPlace(inside,state,originalObject,relatedSet);
            break;
          case "above":
            correctlyPlacedOn = checkForCorrectPlace(above,state,originalObject,relatedSet);
            break;
          case "under":
            correctlyPlacedOn = checkForCorrectPlace(under,state,originalObject,relatedSet);
            break;
          case "beside":
            correctlyPlacedOn = checkForCorrectPlace(beside,state,originalObject,relatedSet);
            break;
          case "leftof":
            correctlyPlacedOn = checkForCorrectPlace(leftOf,state,originalObject,relatedSet);
            break;
          case "rightof":
            correctlyPlacedOn = checkForCorrectPlace(rightOf,state,originalObject,relatedSet);
            break;
          default:
            throw new Error("The relation " + relation + " is unknown.");
        }

        if (correctlyPlacedOn != null) {
          matchingSet.add(originalObject);
          relatedMatchingSet.add(correctlyPlacedOn)
        }
      }

      if (matchingSet.size() == 0)
        throw new Error("Could not find a "
          + Parser.describeComplexObject(entityObject.object)
          + " that is " + relation + " "
          + Parser.describeEntityDetailed(entityObject.location.entity) + ".");

      return {objectIds: matchingSet,
        nestedObjectsIds: flattenLists([matchingSet, relatedMatchingSet]), moves: 1};
    }

    function flattenLists(lists : [collections.LinkedList<string>]) : collections.LinkedList<string> {
      var flattened = new collections.LinkedList<string>();
      for (var list of lists) {
        for (var element of list.toArray())
          flattened.add(element);
      }
      return flattened;
    }

    /*
    * Checks whether or not two objects fulfills a given relation is the given worldstate.
    * The relation will be defined by a given function.
    * @returns the object from the relatedSet that matches, or null if none of them matches.
    */
    function checkForCorrectPlace(fun : (state : WorldState, a : string, b : string) => boolean,
        state: WorldState, obectName : string, relatedSet : collections.LinkedList<string>) : string {
      for (let comparingObject of relatedSet.toArray()) {
        if (fun(state,obectName,comparingObject))
          return comparingObject;
      }
      return null;
    }

    /**
     * @returns All possible combinations of the objects and the locations
     * that obey the physical laws.
     */
    function combineSetsToDNF(state:WorldState,
                              setOfObjects: collections.LinkedList<string>,
                              theRelation: string,
                              setOfLocationObjects: collections.LinkedList<string>,
                              quantifier: string) : DNFFormula  {
      let result : DNFFormula = [];
      let allresult : Conjunction = [];
      let objectSet = setOfObjects.toArray();
      let locationSet = setOfLocationObjects.toArray();
      let errorExplanations : string[] = [];
        
      var numbersFromString: { [quantifier: string] : number } = {};
        numbersFromString["two"] = 2;
        numbersFromString["three"] = 3;


      if(quantifier == "all") {
        if (locationSet.indexOf("floor") >= 0) {
          for (let object of objectSet) {
            allresult.push({polarity:true, relation:theRelation, args:[object.toString(),"floor"]});
          }
          result.push(allresult);
        } else {
          result = allCombinations(objectSet, locationSet, theRelation, state);
          }
        }
      else if(quantifier == "two" || quantifier == "three") {
        if (locationSet.indexOf("floor") >= 0) {
        for (let i:number = 0; i < numbersFromString[quantifier]; i++) {
            let object: string = objectSet[i];
            allresult.push({polarity:true, relation:theRelation, args:[object.toString(),"floor"]});
          }
          result.push(allresult);
        } else {
          result = allCombinations(objectSet, locationSet, theRelation, state);
          }
        }

        else{  
        console.log(stringifyDNF(result));
        for (let object of objectSet) {
          for (let location of locationSet) {
            var physicalCorrectness = checkPhysicalCorrectness(state, object, location, theRelation);
            if(physicalCorrectness.valid)
              result.push([{polarity:true, relation:theRelation, args:[object.toString(),location.toString()]}]);
            else
              errorExplanations.push(physicalCorrectness.explanation);
          }
        }
      } 

      if (result.length == 0) {
        result.push([{polarity:null, relation:null, args:null}]);
        throw getPhysicalLawsErrorExplanation(errorExplanations);
      } else if (result.length > 1 && quantifier == "the") {
        result = [];
        throw "ambiguous command"
      } else console.log("DNFFormula " + stringifyDNF(result));

      return result;
    }

    function allCombinations(objectSet : string[], locationSet: string[], relation: string, state: WorldState) : DNFFormula{
      let arrayA : string[] = objectSet.slice(0);
      let elemA : string = arrayA.shift();
      let result : DNFFormula=[];
      console.log("LocationSet length: " + locationSet.length);
      for(let location = 0; location < locationSet.length; location++) {
        console.log("iteration " + location);
        let newLocationSet = locationSet.slice(0);
        let elemB : string = newLocationSet.splice(location, 1)[0];
        console.log("Combination: " + elemA + " " + elemB);
        if(checkPhysicalCorrectness(state, elemA, elemB, relation).valid){
          if(arrayA.length > 0) {
            allCombinations(arrayA, newLocationSet, relation, state).forEach(function(entry){
              console.log("Recursive call to allCombinations");
              if(entry.length>0) result.push([{polarity:true, relation:relation, args:[elemA,elemB]}].concat(entry));
            });
          } else {
            result.push([{polarity:true, relation:relation, args:[elemA,elemB]}]);
          }
        }

      }
      //console.log(result);
      return result;
    }


    function getPhysicalLawsErrorExplanation(errorExplanations : string[]) : string {
      var errorExplanation = "This command would break the physical laws. ";
      for (var i = 0; i < errorExplanations.length; i++)
        errorExplanation += errorExplanations[i];
        if (i != errorExplanations.length - 1)
          errorExplanation += ". ";
      return errorExplanation;
    }

    /**
     * @returns All possible combinations of the objects and the relation
     * that obey the physical laws.
     */
    function combineSetToDNF(setOfObjects: collections.LinkedList<string>,
                              theRelation: string,
                              quantifier: string) : DNFFormula {
      let result : DNFFormula = [];
      let allresult : Conjunction = [];
      let objectSet = setOfObjects.toArray();

      if(quantifier != "all") {
        for (let object of objectSet) {
          result.push([{polarity:true, relation:theRelation, args:[object.toString()]}]);
        }
      } else {
        for (let object of objectSet) {
          allresult.push({polarity:true, relation:theRelation, args:[object.toString()]});
        }
        result.push(allresult);
      }

      if (result.length == 0) {
        result.push([{polarity:null, relation:null, args:[]}]);
        throw "no results found"
      } else if (result.length > 1 && quantifier == "the") {
        result = [];
        throw "ambiguous command"
      } else console.log("DNFFormula ", stringifyDNF(result));
      return result;
    }

    class PhysicalCorrectnessResult {
      valid : boolean;
      explanation : string; //some kind of an explanation, in case that valid is false
    }

    /**
     * @returns Whether the given relation obeys the physical laws, i.e. whether
     * object a can be in relation to object b in the given world.
     */
    function checkPhysicalCorrectness(state : WorldState, a : string, b : string, relation : string) : PhysicalCorrectnessResult {
      var result : PhysicalCorrectnessResult = {valid: false, explanation: ""};
      let objectA = state.objects[a];

      //TODO: is the floor really large?
      let objectB = b == "floor" ? {color:null, size:"large", form:"floor"} : state.objects[b];

      // Objects cannot be related to themselves
      if (a == b) return {valid: false, explanation: "An object cannot be " + relation + " itself."};

      switch (relation) {
        case "ontop":
          // Balls must be in boxes or on the floor, otherwise they roll away.
          if (objectA.form == "ball" && (objectB.form != "box" && objectB.form != "floor"))
            return {valid: false, explanation: "A ball cannot be placed on top of a " + objectB.form + ", it would roll away."};

          // Small objects cannot support large objects.
          if (objectA.size == "large" && objectB.size == "small")
            return {valid: false, explanation: "A small object cannot support a large one."};

          // Balls cannot support anything.
          if (objectB.form == "ball")
            return {valid: false, explanation: "It's not possible to put something on top of a ball."};

          // Objects are “inside” boxes, but “ontop” of other objects.
          if (objectB.form == "box")
            return {valid: false, explanation: "Objects can be placed inside boxes, but not on top of them."};

        break;

        case "inside":
          // Small objects cannot support large objects.
          if (objectA.size == "large" && objectB.size == "small")
            return {valid: false, explanation: "Small objects cannot support large objects."};

          // Objects are “inside” boxes, but “ontop” of other objects.
          if (objectB.form != "box")
            return {valid: false, explanation: "Boxes are the only objects you can put things 'inside'."};
        break;

        case "under":
          // Small objects cannot support large objects.
          if (objectA.size == "small" && objectB.size == "large")
            return {valid: false, explanation: "Small objects cannot support large objects."};

          // Balls cannot support anything.
          if (objectA.form == "ball")
            return {valid: false, explanation: "It's not possible to put something on top of a ball."};
        break;

        case "beside":
        break;

        case "above":
          // This one is not direct, but it is impossible anyway.
          // Small objects cannot support large objects.
          if (objectA.size == "large" && objectB.size == "small")
            return {valid: false, explanation: "Small objects cannot support large objects."};
        break;

        case "rightof":
        break;

        case "leftof":
        break;
      }

      return {valid: true, explanation: ""};
    }

    /**
    --------------------------------------------------------------------
    TODO: the following functions should likely be moved somewhere else.
    */
    export function onTopOf(state : WorldState, a : string, b : string) : boolean {
      var aPos = getYPosition(state, a);
      var bPos = getYPosition(state, b);

      var aCol = getColumn(state, a);
      var bCol = getColumn(state, b);

      if (b == "floor")
        return aPos == 0;
      else if (aCol != bCol)
        return false;
      else
        return aPos != -1 && bPos != -1 && aPos == bPos + 1;
    }

    export function inside(state : WorldState, a : string, b : string) : boolean {
      // TODO: do we need both onTopOf and inside?
      return onTopOf(state, a, b);
    }

    export function above(state : WorldState, a : string, b : string) : boolean {
      var aPos = getYPosition(state, a);
      var bPos = getYPosition(state, b);

      var aCol = getColumn(state, a);
      var bCol = getColumn(state, b);


      if (b == "floor")
        return true;//aPos != -1;
      else if (aCol != bCol)
        return false;
      else
        return aPos != -1 && bPos != -1 && aPos > bPos;
    }

    export function under(state : WorldState, a : string, b : string) : boolean {
        return above(state, b, a);
    }

    export function beside(state : WorldState, a : string, b : string) : boolean {
      var aCol = getColumn(state, a);
      var bCol = getColumn(state, b);
      return aCol != -1 && bCol != -1 && Math.abs(aCol - bCol) == 1;
    }

    export function leftOf(state : WorldState, a : string, b : string) : boolean {
      var aCol = getColumn(state, a);
      var bCol = getColumn(state, b);
      return aCol != -1 && bCol != -1 && aCol < bCol;
    }

    export function rightOf(state : WorldState, a : string, b : string) : boolean {
      var aCol = getColumn(state, a);
      var bCol = getColumn(state, b);
      return aCol != -1 && bCol != -1 && aCol > bCol;
    }

    /**
    @ returns The zero-based column the the object is in, or -1 if it's not
    part of the world.
    */
    export function getColumn(state : WorldState, a : string) : number {
      if (state.objects[a] != null) {
        for (let s : number = 0; s < state.stacks.length; s++ ) {
            if (state.stacks[s].indexOf(a) > -1)
              return s;
        }
      }
      return -1;
    }

    /**
    @ returns The zero-based position (counted from the floor) in the stack
      the given object is located in, or -1 if it's not part of the world.
    */
    export function getYPosition(state : WorldState, b : string) : number {
      var stack = getColumn(state, b);
      if (stack != -1)
        return state.stacks[stack].indexOf(b);
      else
        return -1;
    }
}
