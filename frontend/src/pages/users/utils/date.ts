export const formatToRadiusDate = (dateTimeLocalStr: string): string => {
  if (!dateTimeLocalStr) return "";
  const d = new Date(dateTimeLocalStr);
  if (isNaN(d.getTime())) return "";
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const pad = (n: number) => String(n).padStart(2, '0');
  
  const day = pad(d.getDate());
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  
  return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
};

export const parseFromRadiusDate = (radiusDateStr: string): string => {
  if (!radiusDateStr) return "";
  const d = new Date(radiusDateStr);
  if (isNaN(d.getTime())) return "";
  
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
