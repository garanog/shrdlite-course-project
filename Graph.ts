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
* A\* search implementation, parameterised by a `Node` type. If no path exists a null-value will
* be returned. If no solution is found in given timespan for the timeout a error will be thrown.
*.
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

  // The time the search started, used to check for timeouts.
  var initTime = new Date().getTime();

  // PriorityQueue contaning all seen paths.
  // The paths are orded by their costs, which is an combination of the cost off all it's edges
  // and the heuristic value of the path from it's endnode
  var frontier = new collections.PriorityQueue<SearchResult<Node>>
    (compareSearchResults);

  // Set of all visited nodes, to be able to make sure we don't test the same paths multiple times
  // and don't get stuck in loops.
  var visited : collections.BSTree<Node> = new collections.BSTree<Node>(graph.compareNodes); 
  frontier.enqueue(new SearchResult([start], heuristics(start)));

  // Check for each path in the frontier. If the frontier becomes empty, it means there are no more
  // reachable nodes and if we have not yet found the goal node there is no solution.
  while (!frontier.isEmpty()) {

    // Check if we have exeeded allowed time, or if a timeout must happen.
    var end = new Date().getTime();
    if (end - initTime > timeout * 1000) {
        throw new Error("Timeout");
    }

    // Pick the current path with lowest cost and heuristic cost, and it's endnode.
    var shortestPath = frontier.dequeue();
    var endNode : Node = shortestPath.path[shortestPath.path.length - 1];

    // Make sure we have not already visited that node.
    if (!visited.contains(endNode)) {

      // If the corrently shortest path reaches the goal, that's the path we're looking for and returns it.
      if (goal(endNode))
        return shortestPath;

      // Mark the node as visited.
      visited.add(endNode);

      // And add all paths that start with the current path and then braches from the endnode to a unvisited
      // node to the frontier.
      for (var edge of graph.outgoingEdges(endNode)) {
        if (!visited.contains(edge.to)){

          // Create a new searchResult (the representation of a path) by making a deep copy of the current
          // path and the new edge, and calculate a new cost. When calculating the new cost, make sure to
          // update the heuristic from the previous endnode ot that of the new endnode.
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
  // If no soultion is found return a failiure result.
  return null;
}

/**
* Creates a combined path from the path of given searchResult and edge by creating a deepcopy.
* @param path The search result whose path to originate from.
* @param edge Edge to add to that path.
* @returns The combined path from the path and the edge.
*/
function extendPath<Node>(path : SearchResult<Node>, edge: Edge<Node>) {
  var resultPath : Array<Node> = new Array<Node>(path.path.length);

  for (var i : number = 0; i < path.path.length; i++)
    resultPath[i] = path.path[i];

  resultPath[path.path.length] = edge.to;

  return resultPath;
}

/**
* Compares the cost two searchResults.
* @param a SearchResult to compare
* @param b SearchResult to compare
* @returns Value less then 0 if a is greater then b, a value grater then 0 if b is greater then a
* and 0 if they're equal.
*/
function compareSearchResults<Node>(a : SearchResult<Node>,
                                    b : SearchResult<Node>) {
    return b.cost - a.cost
}
