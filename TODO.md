## TODO

- [ ] We need to deduplicate stop signs

- [ ] in a group of routes, we need to find the best route. We also need to remove routes that are bad. We need to do this in a way that is efficient and can be scaled.

- [ ] Most likely, the last routes that are generated are going to be best because if there is an avoid zone that we can't avoid, then the routing system will just default to the best way possible. 

- [ ] We basically need to come up with a "better way" based on how many left-hand stop signs there are, how many traffic segments that are larger than the N set amount, and if the route does a U-turn or backtracks really badly. 

- [ ] We should also check right from the start routes to see if the initial routes already pass the criteria. 

- [ ] If multiple routes pass the criteria, we need to optimise for the least amount of delay in traffic.

- [ ] We need to figure out how if a user goes off the path, how we are going to handle that while still staying on the best route.

- [ ] We need to integrate a “ better way” button that will allow the user to crowdsource the best way if they know a good way of getting around. 

- [ ] We need to create a routing system for when a user clicks go

- [ ] we need to create a DB to store stop sign locations so we can reduce detect lookups. 

