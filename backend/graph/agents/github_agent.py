from github import Github
from github.GithubException import GithubException


class GitHubAgent:

    def __init__(self, token: str):
        self.gh = Github(token)

    def list_repos(self):

        try:

            repos = []

            for repo in self.gh.get_user().get_repos():

                repos.append({
                    "name": repo.name,
                    "full_name": repo.full_name,
                    "private": repo.private,
                    "url": repo.html_url,
                })

            return repos

        except GithubException as e:

            return {
                "success": False,
                "message": str(e)
            }

    def create_repo(self, repo_name: str):

        try:

            repo = self.gh.get_user().create_repo(
                name=repo_name
            )

            return {
                "success": True,
                "repo": repo.full_name,
                "url": repo.html_url,
            }

        except GithubException as e:
            if "name already exists" in str(e).lower():
                return {
                    "success": False,
                    "message": f"Repository '{repo_name}' already exists."
                }

            return {
                "success": False,
                "message": str(e)
            }

    def create_issue(
        self,
        repo_name: str,
        title: str,
    ):

        try:

            username = self.gh.get_user().login

            repo = self.gh.get_repo(
                f"{username}/{repo_name}"
            )

            issue = repo.create_issue(
                title=title
            )

            return {
                "success": True,
                "issue_number": issue.number,
                "title": issue.title,
                "url": issue.html_url,
            }

        except GithubException as e:

            return {
                "success": False,
                "message": str(e)
            }

    def list_issues(
        self,
        repo_name: str,
    ):

        try:

            username = self.gh.get_user().login

            repo = self.gh.get_repo(
                f"{username}/{repo_name}"
            )

            issues = []

            for issue in repo.get_issues():

                issues.append({
                    "number": issue.number,
                    "title": issue.title,
                    "state": issue.state,
                    "url": issue.html_url,
                })

            return issues

        except GithubException as e:

            return {
                "success": False,
                "message": str(e)
            }

    def create_branch(
        self,
        repo_name: str,
        branch_name: str,
    ):

        try:

            username = self.gh.get_user().login

            repo = self.gh.get_repo(
                f"{username}/{repo_name}"
            )

            source = repo.get_branch(
                repo.default_branch
            )

            repo.create_git_ref(
                ref=f"refs/heads/{branch_name}",
                sha=source.commit.sha
            )

            return {
                "success": True,
                "branch": branch_name,
            }

        except GithubException as e:
            if "Reference already exists" in str(e):
                   return {
            "success": False,
            "message": f"Branch '{branch_name}' already exists."
        }

            return {
                "success": False,
                "message": str(e)
            }

    def list_branches(
        self,
        repo_name: str,
    ):

        try:

            username = self.gh.get_user().login

            repo = self.gh.get_repo(
                f"{username}/{repo_name}"
            )

            branches = []

            for branch in repo.get_branches():

                branches.append({
                    "name": branch.name
                })

            return branches

        except GithubException as e:

            return {
                "success": False,
                "message": str(e)
            }

    def run(self, command: str):

        command = command.strip()

        if command == "git/list repos":
            return self.list_repos()

        if command.startswith("git/create repo "):

            repo_name = command.replace(
                "git/create repo ",
                "",
                1
            ).strip()

            return self.create_repo(
                repo_name
            )

        if command.startswith("git/create issue "):

            content = command.replace(
                "git/create issue ",
                "",
                1
            )

            repo_name, title = content.split(
                " ",
                1
            )

            return self.create_issue(
                repo_name,
                title
            )

        if command.startswith("git/list issues "):

            repo_name = command.replace(
                "git/list issues ",
                "",
                1
            ).strip()

            return self.list_issues(
                repo_name
            )

        if command.startswith("git/create branch "):

            content = command.replace(
                "git/create branch ",
                "",
                1
            )

            repo_name, branch_name = content.split(
                " ",
                1
            )

            return self.create_branch(
                repo_name,
                branch_name
            )

        if command.startswith("git/list branches "):

            repo_name = command.replace(
                "git/list branches ",
                "",
                1
            ).strip()

            return self.list_branches(
                repo_name
            )
        if command.startswith("git/create file "):

            content = command.replace(
                "git/create file ",
                "",
                1
            )

            parts = content.split(
                " ",
                2
            )

            if len(parts) < 3:
                return {
                    "success": False,
                    "message":
                        "Usage: git/create file <repo> <path> <content>"
                }

            repo_name = parts[0]
            file_path = parts[1]
            file_content = parts[2]

            return self.create_file(
                repo_name,
                file_path,
                file_content
            )
        if command.startswith("git/delete file "):

            content = command.replace(
                "git/delete file ",
                "",
                1
            )

            parts = content.split(
                " ",
                1
            )

            if len(parts) < 2:
                return {
                    "success": False,
                    "message":
                        "Usage: git/delete file <repo> <path>"
                }

            repo_name = parts[0]
            file_path = parts[1]

            return self.delete_file(
                repo_name,
                file_path,
            )
        if command.startswith("git/update file "):

            content = command.replace(
                "git/update file ",
                "",
                1
            )

            parts = content.split(
                " ",
                2
            )

            if len(parts) < 3:
                return {
                    "success": False,
                    "message":
                        "Usage: git/update file <repo> <path> <content>"
                }

            repo_name = parts[0]
            file_path = parts[1]
            file_content = parts[2]

            return self.update_file(
                repo_name,
                file_path,
                file_content
            )

        return {
            "success": False,
            "message": f"Unknown git command: {command}"
            }
    def create_file(
        self,
        repo_name: str,
        path: str,
        content: str,
    ):

        try:

            username = self.gh.get_user().login

            repo = self.gh.get_repo(
                f"{username}/{repo_name}"
            )

            try:

                repo.get_contents(path)

                return {
                    "success": False,
                    "message":
                        f"{path} already exists. Use git/update file."
                }

            except GithubException:

                pass

            result = repo.create_file(
                path=path,
                message=f"Create {path}",
                content=content,
            )

            return {
                "action": "created",
                "success": True,
                "path": path,
                "commit_sha": result["commit"].sha,
            }

        except GithubException as e:

            return {
                "success": False,
                "message": str(e)
            }
    def update_file(
    self,
    repo_name: str,
    path: str,
    content: str,
    ):
        try:

            username = self.gh.get_user().login

            repo = self.gh.get_repo(
                f"{username}/{repo_name}"
            )

            existing = repo.get_contents(
                path
            )

            result = repo.update_file(
                path=path,
                message=f"Update {path}",
                content=content,
                sha=existing.sha,
            )

            return {
                "action": "updated",
                "success": True,
                "path": path,
                "commit_sha": result["commit"].sha,
            }

        except GithubException as e:
            if "Not Found" in str(e):
                 return {
            "success": False,
            "message": f"File '{path}' not found."
        }
               

            return {
                "success": False,
                "message": str(e)
            }
    def delete_file(
    self,
    repo_name: str,
    path: str,
    ):

        try:

            username = self.gh.get_user().login

            repo = self.gh.get_repo(
                f"{username}/{repo_name}"
            )

            existing = repo.get_contents(
                path
            )

            result = repo.delete_file(
                path=path,
                message=f"Delete {path}",
                sha=existing.sha,
            )

            return {
                "success": True,
                "action": "deleted",
                "path": path,
                "commit_sha": result["commit"].sha,
            }

        except GithubException as e:
            if "Not Found" in str(e):
                return {
                    "success": False,
                    "message": f"File '{path}' not found."
                }

            return {
                "success": False,
                "message": str(e)
            }