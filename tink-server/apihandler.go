package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

func preCheck(w http.ResponseWriter, r *http.Request, keys ...string) (done bool) {
	fmt.Printf("precheck running\n")
	vars := mux.Vars(r)
	for _, k := range keys {
		if _, ok := vars[k]; !ok {
			http.Error(w, "500 Internal Server Error",
				http.StatusInternalServerError)
			done = true
			return
		}
	}
	switch r.Method {
	case "OPTIONS":
		setheaders(w.Header())
		done = true
	case "GET", "HEAD":
		setheaders(w.Header())
	default: // refuse the rest
		http.Error(w, "403 Access denied", http.StatusForbidden)
		done = true
	}
	return
}

func setheaders(h http.Header) {
	h.Set("Access-Control-Allow-Origin", "*")
	h.Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
}

func serveJSON(obj interface{}, w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	j := json.NewEncoder(w)
	j.SetIndent("", "  ")
	j.Encode(obj)
}

func collectionsHandler(w http.ResponseWriter, r *http.Request) {
	if preCheck(w, r) {
		return
	}
	cc := []Collection{}
	for _, c := range config.Collections {
		c.Items = nil
		cc = append(cc, c)
	}
	serveJSON(cc, w)
}

func collectionHandler(w http.ResponseWriter, r *http.Request) {
	if preCheck(w, r, "coll") {
		return
	}
	vars := mux.Vars(r)
	c := getCollection(vars["coll"])
	if c == nil {
		http.Error(w, "404 Not Found", http.StatusNotFound)
		return
	}
	cc := *c
	cc.Items = []*Item{}
	serveJSON(cc, w)
}

func itemsHandler(w http.ResponseWriter, r *http.Request) {
	if preCheck(w, r, "coll") {
		return
	}
	vars := mux.Vars(r)
	c := getCollection(vars["coll"])
	if c == nil {
		http.Error(w, "404 Not Found", http.StatusNotFound)
		return
	}
	// copy items
	items := make([]Item, len(c.Items))
	for i := range c.Items {
		items[i] = *c.Items[i]
		items[i].Seasons = []Season{}
		items[i].Nfo = nil
	}

	// hack to show empty items list here.
	var itemsObj interface{} = items
	if len(items) == 0 {
		itemsObj = []string{}
	}
	serveJSON(itemsObj, w)
}

func itemHandler(w http.ResponseWriter, r *http.Request) {
	if preCheck(w, r, "coll", "item") {
		return
	}
	vars := mux.Vars(r)
	i := getItem(vars["coll"], vars["item"])
	if i == nil {
		http.Error(w, "404 Not Found", http.StatusNotFound)
		return
	}

	// decode base NFO into a copy of `item' because we don't want the
	// nfo details to hang around in memory.
	i2 := *i
	if i2.NfoPath != "" {
		file, err := os.Open(i2.NfoPath)
		if err == nil {
			i2.Nfo = decodeNfo(file)
			file.Close()
		}
	}

	// In case of a tvshow, do a deep copy and decode episode NFO
	copy(i2.Seasons, i.Seasons)
	for si := range i2.Seasons {
		copy(i2.Seasons[si].Episodes, i.Seasons[si].Episodes)
		for ei := range i2.Seasons[si].Episodes {
			ep := i2.Seasons[si].Episodes[ei]
			if ep.NfoPath != "" {
				file, err := os.Open(ep.NfoPath)
				if err == nil {
					ep.Nfo = decodeNfo(file)
					file.Close()
					i2.Seasons[si].Episodes[ei] = ep
				}
			}
		}
	}

	serveJSON(&i2, w)
}

func genresHandler(w http.ResponseWriter, r *http.Request) {
	if preCheck(w, r, "coll") {
		return
	}
	vars := mux.Vars(r)
	c := getCollection(vars["coll"])
	if c == nil {
		http.Error(w, "404 Not Found", http.StatusNotFound)
		return
	}

	gc := make(map[string]int)
	for i := range c.Items {
		for _, g := range c.Items[i].Genre {
			if g == "" {
				continue
			}
			if v, found := gc[g]; !found {
				gc[g] = 1
			} else {
				gc[g] = v + 1
			}
		}
	}

	serveJSON(gc, w)
}

type ItemList struct {
	Name  string `json:"name"`
	Label string `json:"label"`
	Value string `json:"value"`
}

func studiosHandler(w http.ResponseWriter, r *http.Request) {
	if preCheck(w, r, "coll") {
		return
	}
	vars := mux.Vars(r)
	c := getCollection(vars["coll"])
	if c == nil {
		http.Error(w, "404 Not Found", http.StatusNotFound)
		return
	}

	gc := make(map[string]int)
	for i := range c.Items {
		g := c.Items[i].Studio
		if v, found := gc[g]; !found {
			gc[g] = 1
		} else {
			gc[g] = v + 1
		}
	}

	var ret []ItemList
	for key, count := range gc {
		ret = append(ret, ItemList{
			Name:  "studio",
			Label: fmt.Sprintf("%s (%d)", key, count),
			Value: key})
	}

	serveJSON(ret, w)
}
