///<reference path="Shrdlite.ts"/>
///<reference path="TextWorld.ts"/>
///<reference path="ExampleWorlds.ts"/>
///<reference path="InterpreterTestCases.ts"/>

interface RelationTestCase {
    descr : string;
    expected : boolean;
    fun : (state : WorldState) => boolean;
}

var relationTestCases = [
  { descr: "m on top of k",
    expected: true,
    fun: (state : WorldState) => Interpreter.onTopOf(state, "m", "k")},
  {descr: "k not on top of m",
   expected: false,
   fun: (state : WorldState) => Interpreter.onTopOf(state, "k", "m")},
  {descr: "l beside e",
    expected: true,
    fun: (state : WorldState) => Interpreter.beside(state, "l", "e")},
  {descr: "l not beside k",
   expected: false,
   fun: (state : WorldState) => Interpreter.beside(state, "l", "k")}
 ];

function testRelation(testcase : RelationTestCase) {
  var relationTestWorld : World = new TextWorld(ExampleWorlds["small"]);

  var pass = testcase.fun(relationTestWorld.currentState) == testcase.expected;
  console.log((pass ? "OK " : "NOT OK ") + testcase.descr);
  return pass;
}

// -----------------------------------------------

interface HoldsTestCase {
  literal : Interpreter.Literal;
  expected : boolean;
}

var holdsTestCases = [
  { literal: {polarity: true, relation: "ontop", args: ["m", "k"]},
    expected: true},
  { literal: {polarity: false, relation: "ontop", args: ["m", "k"]},
    expected: false},
  { literal: {polarity: false, relation: "ontop", args: ["k", "m"]},
    expected: true},
  { literal: {polarity: true, relation: "ontop", args: ["k", "m"]},
    expected: false},
  { literal: {polarity: true, relation: "beside", args: ["l", "e"]},
    expected: true},
  { literal: {polarity: false, relation: "beside", args: ["l", "k"]},
    expected: true}
 ];

function testHolds(testcase : HoldsTestCase) {
  var testWorld : World = new TextWorld(ExampleWorlds["small"]);

  var pass = testcase.expected == Planner.literalHolds(testcase.literal,
    testWorld.currentState);
  console.log((pass ? "OK " : "NOT OK ") +
    testcase.literal.relation + ", " + testcase.literal.args + ", " +
    testcase.literal.polarity);
  return pass;
}

function testPlanner() {
  var pass : boolean = false;
  try {
    var testWorld : World = new TextWorld(ExampleWorlds["test"]);

    var parses : Parser.ParseResult[] = Parser.parse("put the red brick on the white brick");
    console.log(parses);

    var interpretations : Interpreter.CommandInterpretationResult[] = Interpreter.interpret(parses,
        testWorld.currentState).commandInterpretations;
    console.log(interpretations);

    var plan : string[] = Planner.plan(interpretations, testWorld.currentState)[0].plan;

    pass = collections.arrays.equals(plan, ['p','r','d']);
    if (!pass)
      console.log("Planner test failed. Plan: ");
      console.log(plan);
    }catch(err) {
        console.log("ERROR: Planning error!", err);
        pass = false;
    }
    return pass;
}

/**
* This is a simple test case for the question answering pipeline, just
* to ensure that the pipeline basically works.
*/
function testQuestion() : boolean {
  var pass : boolean = false;
  try {
    var testWorld : World = new TextWorld(ExampleWorlds["small"]);

    var parses : Parser.ParseResult[] = Parser.parse("where is the black ball?");
    console.log(parses);

    var interpretations : Interpreter.QuestionInterpretationResult[] = Interpreter.interpret(parses,
        testWorld.currentState).questionInterpretations;
    console.log(interpretations);

    var answers : Answerer.AnswererResult[] = Answerer.answer(interpretations, testWorld.currentState);
    if (answers.length != 1)
      throw new Error("There should be only one answer to the question.");
    else {
      //TODO: change expected answer if necessary.
      pass = answers[0].answer == "The black ball is in the small blue box right of the large blue table";
    }
  } catch(err) {
      console.log("ERROR: Question error!", err);
      pass = false;
  }
  return pass;
}

// -----------------------------------------------

function runCustomTests(argv : string[]) {
    var failed = 0;
    var passed = 0;

    // relation test cases
    for (var i = 0; i < relationTestCases.length; i++) {
      console.log("--------------------------------------------------------------------------------");
      var ok = testRelation(relationTestCases[i]);
      if (!ok) failed++;
      else passed++;
      console.log();
    }

    // holds test cases
    for (var i = 0; i < holdsTestCases.length; i++) {
      console.log("--------------------------------------------------------------------------------");
      var ok = testHolds(holdsTestCases[i]);
      if (!ok) failed++;
      else passed++;
      console.log();
    }

    // simple Planner test cases
    console.log("--------------------------------------------------------------------------------");
    var ok = testPlanner();
    if (!ok) failed++;
    else passed++;
    console.log();

    // question test case
    console.log("--------------------------------------------------------------------------------");
    ok = testQuestion();
    if (!ok) failed++;
    else passed++;
    console.log();

    console.log("--------------------------------------------------------------------------------");
    console.log("Summary statistics");
    console.log("Passed tests: " + passed);
    console.log("Failed tests: " + failed);
    console.log();
}

try {
    runCustomTests(process.argv.slice(2));
} catch(err) {
    console.log("ERROR: " + err);
    console.log();
}
