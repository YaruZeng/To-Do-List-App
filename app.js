//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// mongoose
//   .connect("mongodb://127.0.0.1:27017/todolistDB", {
//     useNewUrlParser: true,
//   })
//   .then(() => console.log("Database connected!"))
//   .catch((err) => console.log(err));

mongoose
  .connect("mongodb+srv://Cluster93867:7dsey7qmxjuawLoL@cluster93867.fih7cgh.mongodb.net/todolistDB", {
    useNewUrlParser: true,
  })
  .then(() => console.log("Database connected!"))
  .catch((err) => console.log(err));

  
// mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

const Item = mongoose.model("Item", itemsSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item. ",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item. ",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);
// const workItems = [];

// get the home page 
app.get("/", function (req, res) {
  // const day = date.getDate();
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) { // no items in the list 
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Default items inserted");
          })
          .catch((error) => {
            console.log(error);
          });
        res.redirect("/");
      } else { // have items in the list 
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

// enter a customer defined list by express route parameter
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName})
  .then((foundList) => {
    if (!foundList) { // it's a new list
      //create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName); // refresh the page
    } else {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items })
    }
  })
  .catch((error) => {
    console.log(error);
  })
});

// add a new item
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  }); 

  if (listName === "Today") { // system default list 
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}) // customer defined list 
    .then((foundList) => {
      foundList.items.push(item); // add a new item into the items array
      foundList.save(); // don't forget to save
      res.redirect("/" + listName);
    });
  }

});

// delete an item
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
    .then(() => {
      console.log("Successfully deleted checked item. ");
      res.redirect("/");
    })
    .catch((error)=> {
      console.log(error);
    })
  } else { // delete from an array beloing to a document with a specified name
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
    .then(() => {
      console.log("Successfully deleted checked item. ");
      res.redirect("/" + listName);
    })
    .catch((error)=> {
      console.log(error);
    })
  }

});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server has started successfully! ");
});
