///<reference path="World.ts"/>
///<reference path="lib/node.d.ts"/>

/**
* Parser module
*
* This module parses a command given as a string by the user into a
* list of possible parses, each of which contains an object of type
* `Command`.
*
*/
module Parser {

    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types

    export function parse(input:string) : ParseResult[] {
        var nearleyParser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
        var parsestr = input.toLowerCase().replace(/\W/g, "");
        try {
            var results : Utterance[] = nearleyParser.feed(parsestr).results;
        } catch(err) {
            if ('offset' in err) {
                throw new Error('Parsing failed after ' + err.offset + ' characters');
            } else {
                throw err;
            }
        }
        if (!results.length) {
            throw new Error('Parsing failed, incomplete input');
        }
        return results.map((res) => {
            // We need to clone the parse result, because parts of it is shared with other parses
            return {input: input, parse: clone(res)};
        });
    }

    /** The output type of the parser
    */
    export interface ParseResult {
	/** The input string given by the user. */
        input : string;
	/** The `utterance` structure that the parser built from `input`. */
        parse : Utterance;
    }

    export interface Utterance {
        type: string;
        command?: Command;
        question?: Question;
    }

    /** The type of a command for the robot. */
    export interface Command {
	/** The verb itself, for example "move", "take", "drop" */
        command : string;
	/** The object in the world, i.e. the `Entity`, which is the patient/direct object of `command`. */
        entity? : Entity;
	/** For verbs of motion, this specifies the destination of the action. */
        location? : Location;
    }

    export interface Question {
        question: string;
        entity?: Entity;
        object?: Object;
    }

    /** A quantified reference (as yet uninterpreted) to an object in the world. */
    export interface Entity {
	/** Specifies a determiner (e.g. "the", "a/an", "any", "all"). */
        quantifier : string;
        object : Object;
    }

    /** A location in the world. */
    export interface Location {
	/** A preposition such as "beside", "above", etc. */
        relation : string;
	/** The entity relative to which the preposition should be interpreted. */
        entity : Entity;
    }

    /**
     * A user's description of an object in the world. A basic object
     * is described by its size ("small", "large", etc.), color
     * ("black", "white", etc.) and form ("object", "ball", "box",
     * etc.), all of which are optional. An object can also be
     * described using a relative clause (e.g. "the ball inside the
     * box"), which is given as an object (field `object?`) and a
     * location (field `location?`).
     *
     * This type should really be a union type, but TypeScript doesn't
     * support that. Instead, we include all possible fields and
     * assume that if `object?` and `location?` are set, the others
     * will be undefined and vice versa.
     *
     */
    export interface Object {
	/** Recursive reference to an object using a relative clause. */
        object? : Object;
	/** Location of the object in the relative clause. */
        location? : Location;
        // Here is the union type divisor
        size? : string;
        color? : string;
        form? : string;
    }

    export function stringify(result : ParseResult) : string {
        return JSON.stringify(result.parse);
    }

    //////////////////////////////////////////////////////////////////////
    // Utilities

    /**
    * Describe the given object, assuming that it is a simple object
    */
    export function describeObject(obj: Object) : string {
      return (obj.size != null ? (obj.size + " ") : "")
        + (obj.color != null ? (obj.color + " ") : "")
        + (obj.form != "anyform" ? (obj.form) : "object");
    }

    /**
    * Describe the given object. This method will unfold composed
    * objects until simple objects are reached and return an
    * appropriate description for the whole object.
    */
    export function describeComplexObjectDetailed(obj: Object) : string {
      if (obj.location == null) {
        return describeObject(obj);
      } else {
        return "(" + describeComplexObject(obj.object)
          + " that is " + obj.location.relation + " "
          + describeComplexObject(obj.location.entity.object) + ")";
      }
    }

    export function describeComplexObject(obj: Object) : string {
      // TODO: intelligent way of describing only what's necessary!
      return describeComplexObjectDetailed(obj);
    }

    export function describeEntityDetailed(entity: Entity) : string {
      return entity.quantifier + " " + describeComplexObjectDetailed(entity.object);
    }

    export function getInnermostObject(topLevelObj: Object) : Object {
      var obj : Parser.Object;
      for (obj = topLevelObj; obj.object != null; obj = obj.object) {
      }
      return obj;
    }

    function clone<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }

}


//////////////////////////////////////////////////////////////////////
// TypeScript declarations for external JavaScript modules

declare module "grammar" {
    export var ParserRules : { [s:string]: any };
    export var ParserStart : string;
}


declare module "nearley" {
    export class Parser {
        constructor(rules: {[s:string]:any}, start: string);
        feed(sentence: string) : {
            results : Parser.Utterance[];
        }
    }
}


if (typeof require !== 'undefined') {
    // Node.JS way of importing external modules
    // In a browser, they must be included from the HTML file
    var nearley = require('./lib/nearley.js');
    var grammar = require('./grammar.js');
}
