Most information abour our implementation exists as comments in the code, heres an overview:

Each path is represented by a SearchResult, and all possible paths we can currently see are
placed in a priorityqueue, representing the frontier.

The function works by taking the cheapest path from the priorityqueue (cheapest in regards of
total cost of all edges and the heuristic of the endnode). It then checks that we have not yet
visited the end of that path, and if the path goes to our goal, if it does we're done.

If niether of those are true we add all newly discovered paths to the priorityqueue. To make
sure we don't get stuck in any loops we only add paths that goes to unvisited nodes.

We keep track of which nodes that are visited by putting them in a set.