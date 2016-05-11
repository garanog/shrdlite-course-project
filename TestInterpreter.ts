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
  {descr: "m on top of k",
   expected: true,
   fun: (state) => Interpreter.onTopOf(state, "m", "k")}];

/*
function testRelations() : boolean {

  testBoolean();
  testBoolean("k not on top of m", false, Interpreter.onTopOf(world, "k", "m"));
  testBoolean("l beside e", true, Interpreter.onTopOf(world, "l", "e"));
  testBoolean("l not beside k", false, Interpreter.onTopOf(world, "l", "k"));
}*/

function testRelation(testcase : RelationTestCase) {
  var relationTestWorld : World = new TextWorld(ExampleWorlds["small"]);

  var pass = testcase.fun(relationTestWorld);
  console.log((pass ? "OK " : "NOT OK ") + testcase.descr);
  return pass;
}

function testInterpreter(testcase : TestCase) : boolean {
    var world : World = new TextWorld(ExampleWorlds[testcase.world]);
    var utterance : string = testcase.utterance;

    console.log('Testing utterance: "' + utterance + '", in world "' + testcase.world + '"');
    try {
        var parses : Parser.ParseResult[] = Parser.parse(utterance);
        console.log("Found " + parses.length + " parses");
    }
    catch(err) {
        console.log("ERROR: Parsing error!", err);
        return false;
    }

    var correctints : string[] = testcase.interpretations.map((intp) => intp.sort().join(" | ")).sort();
    try {
        var interpretations : string[] = Interpreter.interpret(parses, world.currentState).map((intp) => {
            return intp.interpretation.map((literals) => literals.map(Interpreter.stringifyLiteral).sort().join(" & ")).sort().join(" | ");
        }).sort();
    }
    catch(err) {
        interpretations = [];
    }

    console.log("Correct interpretations:");
    var n = 0;
    interpretations.forEach((intp) => {
        if (correctints.some(i => i == intp)) {
            n++;
            console.log("    (" + n + ") " + intp);
        }
    });
    if (n == correctints.length && n == interpretations.length) {
        if (n == 0) {
            console.log("    There are no interpretations!")
        }
        console.log("Everything is correct!")
        return true;
    }
    if (n == 0) {
        console.log("    No correct interpretations!")
    };

    if (n < correctints.length) {
        console.log("Missing interpretations:");
        correctints.forEach((intp) => {
            if (!interpretations.some(j => j == intp)) {
                console.log("    (-) " + intp);
            }
        });
    }
    if (n < interpretations.length) {
        console.log("Incorrect interpretations:");
        interpretations.forEach((intp) => {
            if (!correctints.some(i => i == intp)) {
                n++;
                console.log("    (" + n + ") " + intp);
            }
        });
    }
    return false;
}


function runTests(argv : string[]) {
    var testcases : TestCase[] = [];
    if (argv.length == 0 || argv[0] == "all") {
        testcases = allTestCases;
    } else {
        for (var n of argv) {
            testcases.push(allTestCases[parseInt(n)-1]);
        }
    }

    var failed = 0;
    for (var i = 0; i < testcases.length; i++) {
        console.log("--------------------------------------------------------------------------------");
        var ok = testInterpreter(testcases[i]);
        if (!ok) failed++;
        console.log();
    }

    // relation test cases
    for (var i = 0; i < relationTestCases.length; i++) {
      console.log("--------------------------------------------------------------------------------");
      var ok = testRelation(relationTestCases[i]);
      if (!ok) failed++;
      console.log();
    }

    console.log("--------------------------------------------------------------------------------");
    console.log("Summary statistics");
    console.log("Passed tests: " + (testcases.length - failed));
    console.log("Failed tests: " + failed);
    console.log();
}

try {
    runTests(process.argv.slice(2));
} catch(err) {
    console.log("ERROR: " + err);
    console.log();
    console.log("Please give at least one argument:");
    console.log("- either a number (1.." + allTestCases.length + ") for each test you want to run,");
    console.log("- or 'all' for running all tests.");
}
