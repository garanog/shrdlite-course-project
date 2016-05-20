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
  var testWorld : World = new TextWorld(ExampleWorlds["test"]);

  var parses : Parser.ParseResult[] = Parser.parse("put the red brick on the white brick");
  console.log(parses);

  var interpretations : Interpreter.InterpretationResult[] = Interpreter.interpret(parses,
      testWorld.currentState);
  console.log(interpretations);

  var plan : string[] = Planner.plan(interpretations, testWorld.currentState)[0].plan;

  var pass : boolean = plan == ["p","r","d"];
  if (!pass)
    console.log("Planner test failed. Plan: ");
    console.log(plan);
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
