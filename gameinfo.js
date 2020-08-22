const users = [];
const matches = [];

////users///////
const addUser = ({ id, name, room, rol,points}) => {
    let existingUser;
    users.forEach(user=>{if(user.name===name&&user.room===room){existingUser=true;}});
    if (existingUser===true) {
        return { error: "usarname is taken" }
    }
    const user = { id, name, room,rol,points };
    users.push(user);
    return { user };
}
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id == id);
    if (index !== -1) {
        return users.splice(index, 1)[0];
    }

}
const getUser = (id) => users.find((user) => user.id === id);

const getUsersInRoom = (room) => users.filter((user) => user.room == room)

///matches//////
const addMatch = ({ room, operation, limit }) => {
    const existingMatch = matches.find(match => { match.room === room });
    if (existingMatch) {
        return { error: "room is taken" }
    }
    var numbers = [];
    for (var i = 0; i < 21; i++) {
        numbers.push(parseInt(Math.random() * (10 - 0) + 0));
    }
    var num1 = numbers[Math.floor(Math.random() * numbers.length)];
    var num2 = numbers[Math.floor(Math.random() * numbers.length)];
      var operators = {
         'suma': function (a, b) { return a + b },
         'resta': function (a, b) { return a < b ? b - a : a - b },
         'multi': function (a, b) { return a * b }
      }
    var res=operators[operation](num1, num2);
    const match = { room, operation, limit, numbers, res, start:false};
    matches.push(match);
    return { match };
}
const getMatch = (room) => matches.find((match) => match.room === room);

const removeMatch = ({ room }) => {
    const index = matches.findIndex((match) => match.room = room);
    if (index !== -1) {
        return matches.splice(index, 1)[0];
    }
}


module.exports = { addUser, removeUser, getUser, getUsersInRoom, addMatch, removeMatch,getMatch,users,matches }