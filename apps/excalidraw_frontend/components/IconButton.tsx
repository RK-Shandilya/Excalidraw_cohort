export function IconButton({
    icon, onClick, activated
}: {
    icon: React.ReactNode,
    onClick: () => void,
    activated: boolean
}) {
    return (
        <div className={`pointer rounded-md p-2 ${activated ? "bg-cyan-700" : ""}`} onClick={onClick}>
            {icon}
        </div>
    )
}