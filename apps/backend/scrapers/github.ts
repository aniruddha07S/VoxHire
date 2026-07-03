import axios from "axios";

const headers = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
};

export async function scrapeGithub(username: string) {
  const [profileRes, reposRes] = await Promise.all([
    axios.get(`https://api.github.com/users/${username}`, { headers }),
    axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, { headers }),
  ]);

  return {
    profile: {
      name: profileRes.data.name,
      bio: profileRes.data.bio,
      location: profileRes.data.location,
      company: profileRes.data.company,
      publicRepos: profileRes.data.public_repos,
      followers: profileRes.data.followers,
    },
    repos: reposRes.data.map((x: any) => ({
      name: x.name,
      description: x.description,
      fullName: x.full_name,
      starCount: x.stargazers_count,
      language: x.language,
      topics: x.topics,
    })),
  };
}