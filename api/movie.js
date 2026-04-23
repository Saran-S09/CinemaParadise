export default async function handler(req, res) {
  const { id } = req.query;
  const key = process.env.TMDB_KEY;

  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${key}&append_to_response=videos,credits`;

  const response = await fetch(url);
  const data = await response.json();

  res.status(200).json(data);
}