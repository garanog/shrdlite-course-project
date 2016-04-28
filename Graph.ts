///<reference path="lib/collections.ts"/>
///<reference path="lib/node.d.ts"/>

/** Graph module
*
*  Types for generic A\* implementation.
*
*  *NB.* The only part of this module
*  that you should change is the `aStarSearch` function. Everything
*  else should be used as-is.
*/

/** An edge in a graph. */
class Edge<Node> {
    from : Node;
    to   : Node;
    cost : number;
}

/** A directed graph. */
interface Graph<Node> {
    /** Computes the edges that leave from a node. */
    outgoingEdges(node : Node) : Edge<Node>[];
    /** A function that compares nodes. */
    compareNodes : collections.ICompareFunction<Node>;
}

/** Type that reports the result of a search. */
class SearchResult<Node> {
    constructor(
        /** The path (sequence of Nodes) found by the search algorithm. */
        public path : Node[],
        /** The total cost of the path. */
        public cost : number
    ) {}
}


/**
* A\* search implementation, parameterised by a `Node` type. The code
* here is just a template; you should rewrite this function
* entirely. In this template, the code produces a dummy search result
* which just picks the first possible neighbour.
*
* Note that you should not change the API (type) of this function,
* only its body.
* @param graph The graph on which to perform A\* search.
* @param start The initial node.
* @param goal A function that returns true when given a goal node. Used to determine if the algorithm has reached the goal.
* @param heuristics The heuristic function. Used to estimate the cost of reaching the goal from a given Node.
* @param timeout Maximum time (in seconds) to spend performing A\* search.
* @returns A search result, which contains the path from `start` to a node satisfying `goal` and the cost of this path.
*/
function aStarSearch<Node> (
    graph : Graph<Node>,
    start : Node,
    goal : (n:Node) => boolean,
    heuristics : (n:Node) => number,
    timeout : number
) : SearchResult<Node> {
  var frontier = new collections.PriorityQueue<SearchResult<Node>>
    (compareSearchResults);

  var visited : collections.Set<Node> = new collections.Set<Node>();
  frontier.enqueue(new SearchResult([start], heuristics(start)));

  while (!frontier.isEmpty()) {
    var shortestPath = frontier.dequeue();
    var endNode : Node = shortestPath.path[shortestPath.path.length - 1];

    if (!visited.contains(endNode)) {
      if (goal(endNode))
        return shortestPath;

      visited.add(endNode);
      for (var edge of graph.outgoingEdges(endNode)) {
        if (!visited.contains(edge.to)){
          var extendedPath : Array<Node> = extendPath(shortestPath, edge);
          var extendedCost = shortestPath.cost - heuristics(endNode)
            + heuristics(edge.to) + edge.cost;

          var extendedSearchResult : SearchResult<Node> = new SearchResult(
            extendedPath, extendedCost);

          frontier.enqueue(extendedSearchResult);
        }
      }
    }
  }
  return null;
}

function extendPath<Node>(path : SearchResult<Node>, edge: Edge<Node>) {
  var resultPath : Array<Node> = new Array<Node>(path.path.length);

  for (var i : number = 0; i < path.path.length; i++)
    resultPath[i] = path.path[i];

  resultPath[path.path.length] = edge.to;

  return resultPath;
}

function compareSearchResults<Node>(a : SearchResult<Node>,
                                    b : SearchResult<Node>) {
    return b.cost - a.cost
}
