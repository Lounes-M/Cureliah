export type DocumentFile = {
  id: string;
  name: string;
  url: string;
  [key: string]: any;
};

declare global {
  type DocumentFile = {
    id: string;
    name: string;
    url: string;
    [key: string]: any;
  };
}
