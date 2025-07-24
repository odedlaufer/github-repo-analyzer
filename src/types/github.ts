export interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree'; // 'blob' = file, 'tree' = directory
}

export interface RepoStructure {
  depth: number;
  keyFiles: string[];
  keyDirs: string[];
  issues: string[];
  securityWarnings: string[];
  ciTools?: string[];
}
