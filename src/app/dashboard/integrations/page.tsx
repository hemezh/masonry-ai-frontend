export default function IntegrationsPage() {
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Integrations</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
                    <p className="text-muted-foreground">
                        Integrations will be available soon. Stay tuned for updates!
                    </p>
                </div>
            </div>
        </div>
    );
}
