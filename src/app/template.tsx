/** template จะ mount ใหม่ทุกครั้งที่เปลี่ยนหน้า → เล่น animation เข้าหน้าใหม่ */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
