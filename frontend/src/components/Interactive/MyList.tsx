import { useEffect, useState } from 'react';

type Favorite = {
  id: string;
  tmdb_id: number;
  movie_title: string;
  poster_path: string | null;
  has_review: boolean;
};

const API_URL = import.meta.env.PUBLIC_API_BASE_URL ?? '';

export function MyList() {
  const [movies, setMovies] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/favorites`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('お気に入りを取得できませんでした');
        }

        return response.json() as Promise<Favorite[]>;
      })
      .then(setMovies)
      .catch((reason: unknown) => {
        console.error(reason);
        setError('マイリストを読み込めませんでした');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-slate-400">読み込み中...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (movies.length === 0) {
    return <p className="text-slate-400">お気に入りはありません。</p>;
  }

  return (
    <div className="space-y-3">
      {movies.map((movie) => (
        <a
          key={movie.tmdb_id}
          href={`/movie/${movie.tmdb_id}`}
          className="flex items-center gap-4 rounded-lg p-2 text-white hover:bg-slate-800"
        >
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
              alt={movie.movie_title}
              className="h-20 w-14 rounded object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-20 w-14 rounded bg-slate-800" />
          )}

          <div className="min-w-0">
            <span className="font-bold">{movie.movie_title}</span>

            {movie.has_review && (
              <span className="ml-2 rounded-full bg-emerald-900 px-2 py-1 text-xs text-emerald-300">
                レビュー済み
              </span>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}