export default async function handler(req, res) {
  const API_KEY = process.env.TMDB_KEY;
  const query = req.query.q;

  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}&include_adult=false`
  );

  const data = await response.json();
  res.status(200).json(data);
}