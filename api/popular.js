export default async function handler(req, res) {
  const API_KEY = process.env.TMDB_KEY;

  const response = await fetch(
    `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&include_adult=false`
  );

  const data = await response.json();
  res.status(200).json(data);
}