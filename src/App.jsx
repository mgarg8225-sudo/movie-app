import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getMovieRecommendations } from "./claude";
import "./App.css";

const API_KEY = "d28c9fff";
const API_URL = "https://www.omdbapi.com/";

function App() {
  const [search, setSearch] = useState("");
  const [movies, setMovies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mood, setMood] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    loadFavorites();
  }, []);

  const searchMovies = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}?s=${search}&apikey=${API_KEY}`);
      const data = await res.json();
      if (data.Response === "True") {
        setMovies(data.Search);
      } else {
        setError("No movies found. Try a different search.");
        setMovies([]);
      }
    } catch (err) {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  };

  const loadFavorites = async () => {
    const querySnapshot = await getDocs(collection(db, "favorites"));
    const favs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setFavorites(favs);
  };

  const addFavorite = async (movie) => {
    const already = favorites.find(f => f.imdbID === movie.imdbID);
    if (already) return alert("Already in favorites!");
    await addDoc(collection(db, "favorites"), movie);
    loadFavorites();
  };

  const removeFavorite = async (id) => {
    await deleteDoc(doc(db, "favorites", id));
    loadFavorites();
  };

  const getRecommendations = async () => {
  if (!mood.trim()) return;
  setAiLoading(true);
  setAiError("");
  setRecommendations("");
  try {
    const result = await getMovieRecommendations(mood);
    setRecommendations(result);
  } catch (err) {
    setAiError("Could not get recommendations. Please try again.");
  }
  setAiLoading(false);
};

  return (
    <div className="app">
      <h1>🎬 Movie App</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search for a movie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchMovies()}
        />
        <button onClick={searchMovies}>Search</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}


      <div className="section ai-section">
  <h2>🤖 AI Movie Recommendations</h2>
  <p className="ai-desc">Tell me your mood and I'll suggest movies!</p>
  <div className="search-bar">
    <input
      type="text"
      placeholder="e.g. I want something funny and light..."
      value={mood}
      onChange={(e) => setMood(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && getRecommendations()}
    />
    <button onClick={getRecommendations}>Get Ideas</button>
  </div>
  {aiLoading && <p>Getting recommendations...</p>}
  {aiError && <p className="error">{aiError}</p>}
  {recommendations && (
    <div className="recommendations">
      <pre>{recommendations}</pre>
    </div>
  )}
</div>
      <div className="section">
        <h2>Search Results</h2>
        <div className="movies-grid">
          {movies.map(movie => (
            <div key={movie.imdbID} className="movie-card">
              <img
                src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/150"}
                alt={movie.Title}
              />
              <h3>{movie.Title}</h3>
              <p>{movie.Year}</p>
              <button onClick={() => addFavorite(movie)}>❤️ Add to Favorites</button>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>❤️ My Favorites</h2>
        <div className="movies-grid">
          {favorites.map(movie => (
            <div key={movie.id} className="movie-card">
              <img
                src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/150"}
                alt={movie.Title}
              />
              <h3>{movie.Title}</h3>
              <p>{movie.Year}</p>
              <button className="remove" onClick={() => removeFavorite(movie.id)}>🗑️ Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;