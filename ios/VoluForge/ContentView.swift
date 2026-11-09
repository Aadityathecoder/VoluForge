import SwiftUI

private enum VFColor {
    static let paper = Color(red: 0.96, green: 0.95, blue: 0.91)
    static let ink = Color(red: 0.12, green: 0.13, blue: 0.11)
    static let orange = Color(red: 0.91, green: 0.37, blue: 0.16)
    static let green = Color(red: 0.83, green: 0.89, blue: 0.78)
    static let forest = Color(red: 0.22, green: 0.36, blue: 0.25)
    static let muted = Color(red: 0.43, green: 0.45, blue: 0.41)
    static let line = Color(red: 0.86, green: 0.85, blue: 0.81)
    static let peach = Color(red: 0.96, green: 0.87, blue: 0.79)
}

private enum MainTab: String, CaseIterable, Identifiable {
    case home = "Home"
    case fellowship = "Fellowship"
    case discover = "Discover"
    case profile = "Profile"

    var id: String { rawValue }
    var symbol: String {
        switch self {
        case .home: return "house"
        case .fellowship: return "person.3"
        case .discover: return "safari"
        case .profile: return "person.crop.circle"
        }
    }
}

private struct Fellow: Identifiable {
    let id: String
    let name: String
    let role: String
    let school: String
    let skills: [String]
    let initials: String
    let tint: Color
}

private struct Mission: Identifiable {
    let id: String
    let title: String
    let partner: String
    let phase: String
    let detail: String
    let skills: [String]
}

private let fellows = [
    Fellow(id: "maya", name: "Maya Patel", role: "Fellow · research", school: "North Bay High", skills: ["Research", "Writing"], initials: "MP", tint: VFColor.peach),
    Fellow(id: "jordan", name: "Jordan Lee", role: "Fellow · design", school: "Westview Academy", skills: ["Design", "Outreach"], initials: "JL", tint: VFColor.green),
    Fellow(id: "noah", name: "Noah Williams", role: "Fellow · data", school: "Pinecrest School", skills: ["Data", "Mapping"], initials: "NW", tint: Color(red: 0.87, green: 0.88, blue: 0.94)),
    Fellow(id: "elena", name: "Elena Cruz", role: "Mentor · community", school: "Harbor Learning Lab", skills: ["Mentoring", "Partnerships"], initials: "EC", tint: Color(red: 0.94, green: 0.88, blue: 0.72))
]

private let missions = [
    Mission(id: "food", title: "Map neighborhood food access", partner: "Neighbors’ Table", phase: "Research · week 3 of 8", detail: "Build a clear picture of pantry access so the partner can plan volunteer routes and supply pickups.", skills: ["Research", "Mapping", "Community"]),
    Mission(id: "reading", title: "Make reading circles easier to join", partner: "Little Chapters Project", phase: "Design · week 2 of 8", detail: "Create and test a welcoming signup flow with the people who run the weekly reading circles.", skills: ["Design", "Writing", "Education"])
]

struct ContentView: View {
    @State private var selectedTab: MainTab = .home
    @State private var selectedFellow: Fellow?
    @State private var selectedMission: Mission?
    @State private var joinedMissionIDs: Set<String> = ["food"]
    @State private var connectedIDs: Set<String> = []

    var body: some View {
        ZStack {
            VFColor.paper.ignoresSafeArea()
            Group {
                switch selectedTab {
                case .home: homeScreen
                case .fellowship: fellowshipScreen
                case .discover: discoverScreen
                case .profile: profileScreen
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .safeAreaInset(edge: .bottom, spacing: 0) { tabBar }
        .preferredColorScheme(.light)
        .sheet(item: $selectedFellow) { fellow in fellowSheet(fellow) }
        .sheet(item: $selectedMission) { mission in missionSheet(mission) }
    }

    private var homeScreen: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 24) {
                previewBadge
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 8) {
                        eyebrow("YOUR CIVIC IMPACT")
                        Text("Good work,\nmade visible.")
                            .font(.system(size: 36, weight: .bold, design: .rounded))
                            .tracking(-1.2)
                            .foregroundStyle(VFColor.ink)
                    }
                    Spacer()
                    Image(systemName: "sparkles")
                        .font(.system(size: 28, weight: .medium))
                        .foregroundStyle(VFColor.orange)
                        .padding(.top, 25)
                }

                VStack(alignment: .leading, spacing: 18) {
                    HStack {
                        eyebrow("FALL FELLOWSHIP · SAMPLE")
                        Spacer()
                        Image(systemName: "arrow.up.right")
                            .font(.system(size: 13, weight: .semibold))
                    }
                    HStack(alignment: .firstTextBaseline, spacing: 7) {
                        Text("18.5").font(.system(size: 47, weight: .bold, design: .rounded)).tracking(-2)
                        Text("verified hours").font(.system(size: 14, weight: .medium))
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.white.opacity(0.55))
                            Capsule().fill(VFColor.forest).frame(width: geo.size.width * 0.46)
                        }
                    }
                    .frame(height: 6)
                    HStack {
                        Text("46% of your 40 hour goal")
                        Spacer()
                        Text("18.5 / 40")
                    }
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(VFColor.forest)
                }
                .padding(20)
                .background(VFColor.green, in: RoundedRectangle(cornerRadius: 23))

                HStack(spacing: 0) {
                    metric("2", label: "missions")
                    metric("3", label: "work items accepted")
                    metric("26", label: "neighbors reached")
                }
                .padding(.vertical, 17)
                .background(.white.opacity(0.68), in: RoundedRectangle(cornerRadius: 18))

                VStack(alignment: .leading, spacing: 13) {
                    sectionHeader("Your people", action: "Meet the cohort") { selectedTab = .fellowship }
                    HStack(spacing: -8) {
                        ForEach(fellows.prefix(4)) { fellow in avatar(fellow, size: 42) }
                        Text("+16")
                            .font(.system(size: 12, weight: .bold))
                            .frame(width: 42, height: 42)
                            .background(VFColor.ink, in: Circle())
                            .foregroundStyle(.white)
                            .overlay(Circle().stroke(VFColor.paper, lineWidth: 3))
                    }
                    Text("Your cohort is working on local needs together. Find a teammate with the skills your mission needs.")
                        .font(.system(size: 13))
                        .lineSpacing(4)
                        .foregroundStyle(VFColor.muted)
                }

                VStack(alignment: .leading, spacing: 13) {
                    sectionHeader("Next up", action: "See missions") { selectedTab = .discover }
                    missionCard(missions[0])
                }

                Text("Preview only · all people, hours, and outcomes shown here are fictional sample data.")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(VFColor.muted)
                    .padding(.top, 4)
            }
            .padding(.horizontal, 22)
            .padding(.top, 14)
            .padding(.bottom, 28)
        }
    }

    private var fellowshipScreen: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 22) {
                previewBadge
                eyebrow("YOUR COHORT")
                Text("Build good\nthings together.")
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .tracking(-1)
                    .foregroundStyle(VFColor.ink)
                HStack(spacing: 12) {
                    Image(systemName: "circle.grid.2x2.fill").font(.system(size: 18)).foregroundStyle(VFColor.orange)
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Community Impact Fellowship").font(.system(size: 15, weight: .bold))
                        Text("Fall 2026 · weeks 3 of 8 · 20 fellows")
                            .font(.system(size: 11, weight: .medium)).foregroundStyle(VFColor.muted)
                    }
                    Spacer()
                    Image(systemName: "chevron.right").font(.system(size: 12, weight: .bold)).foregroundStyle(VFColor.muted)
                }
                .padding(16)
                .background(.white.opacity(0.78), in: RoundedRectangle(cornerRadius: 17))

                VStack(alignment: .leading, spacing: 10) {
                    eyebrow("YOUR SQUAD")
                    Text("Food access research").font(.system(size: 21, weight: .bold, design: .rounded))
                    Text("A small team, working with Neighbors’ Table on a need they brought to the fellowship.")
                        .font(.system(size: 13)).lineSpacing(4).foregroundStyle(VFColor.muted)
                }
                .padding(18)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(VFColor.peach.opacity(0.72), in: RoundedRectangle(cornerRadius: 19))

                sectionHeader("People to build with", action: "") {}
                ForEach(fellows) { fellow in fellowRow(fellow) }

                VStack(alignment: .leading, spacing: 14) {
                    sectionHeader("Squad missions", action: "All missions") { selectedTab = .discover }
                    ForEach(missions) { missionCard($0) }
                }

                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: "checkmark.seal.fill").foregroundStyle(VFColor.forest)
                    Text("Skills are tied to work your partner reviewed, not self-assigned reputation scores.")
                        .font(.system(size: 12)).lineSpacing(3).foregroundStyle(VFColor.muted)
                }
                .padding(.top, 3)
            }
            .padding(.horizontal, 22)
            .padding(.top, 14)
            .padding(.bottom, 26)
        }
    }

    private var discoverScreen: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                previewBadge
                eyebrow("REAL NEEDS · SAMPLE CONTENT")
                Text("Find a mission\nthat fits you.")
                    .font(.system(size: 34, weight: .bold, design: .rounded)).tracking(-1)
                Text("Work with your fellowship squad on needs shared by community partners.")
                    .font(.system(size: 14)).lineSpacing(4).foregroundStyle(VFColor.muted)
                ForEach(missions) { missionCard($0) }
            }
            .padding(.horizontal, 22).padding(.top, 14).padding(.bottom, 28)
        }
    }

    private var profileScreen: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                previewBadge
                eyebrow("YOUR PROFILE")
                HStack(spacing: 15) {
                    ZStack {
                        Circle().fill(VFColor.peach).frame(width: 68, height: 68)
                        Text("AM").font(.system(size: 20, weight: .bold)).foregroundStyle(VFColor.ink)
                    }
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Avery Morgan").font(.system(size: 23, weight: .bold, design: .rounded))
                        Text("Student fellow · Westview Academy")
                            .font(.system(size: 12)).foregroundStyle(VFColor.muted)
                    }
                }
                Text("I like using research and design to make community projects easier to join.")
                    .font(.system(size: 14)).lineSpacing(4).foregroundStyle(VFColor.muted)
                VStack(alignment: .leading, spacing: 12) {
                    eyebrow("SKILLS IN PRACTICE")
                    skillPills(["Research", "Writing", "Community outreach"])
                    Text("Shown here as sample profile information. Skills become verified only after accepted work is reviewed by a partner.")
                        .font(.system(size: 11)).lineSpacing(3).foregroundStyle(VFColor.muted)
                }
                .padding(18).background(.white.opacity(0.75), in: RoundedRectangle(cornerRadius: 18))
                Text("Local preview · no account data is saved or shared.")
                    .font(.system(size: 11, weight: .medium)).foregroundStyle(VFColor.muted)
            }
            .padding(22)
        }
    }

    private var previewBadge: some View {
        HStack(spacing: 7) {
            Circle().fill(VFColor.orange).frame(width: 6, height: 6)
            Text("PREVIEW · FICTIONAL SAMPLE DATA")
                .font(.system(size: 9, weight: .bold, design: .rounded)).tracking(0.8)
        }
        .foregroundStyle(VFColor.muted)
        .padding(.horizontal, 11).padding(.vertical, 8)
        .background(.white.opacity(0.78), in: Capsule())
    }

    private var tabBar: some View {
        HStack(spacing: 3) {
            ForEach(MainTab.allCases) { tab in
                Button { selectedTab = tab } label: {
                    VStack(spacing: 5) {
                        Image(systemName: tab.symbol).font(.system(size: 17, weight: .semibold))
                        Text(tab.rawValue).font(.system(size: 9, weight: .semibold))
                    }
                    .foregroundStyle(selectedTab == tab ? VFColor.ink : Color.white.opacity(0.7))
                    .frame(maxWidth: .infinity).frame(height: 50)
                    .background(selectedTab == tab ? VFColor.paper : .clear, in: Capsule())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(6)
        .background(VFColor.ink, in: Capsule())
        .padding(.horizontal, 18).padding(.top, 8).padding(.bottom, 5)
        .background(VFColor.paper.opacity(0.96))
    }

    private func metric(_ value: String, label: String) -> some View {
        VStack(spacing: 5) {
            Text(value).font(.system(size: 23, weight: .bold, design: .rounded)).foregroundStyle(VFColor.ink)
            Text(label).font(.system(size: 9, weight: .medium)).multilineTextAlignment(.center).foregroundStyle(VFColor.muted)
                .frame(maxWidth: .infinity)
        }
        .frame(maxWidth: .infinity)
        .overlay(alignment: .trailing) { Rectangle().fill(VFColor.line).frame(width: 1, height: 31).offset(x: 1) }
    }

    private func sectionHeader(_ title: String, action: String, perform: @escaping () -> Void) -> some View {
        HStack {
            Text(title).font(.system(size: 19, weight: .bold, design: .rounded)).foregroundStyle(VFColor.ink)
            Spacer()
            if !action.isEmpty {
                Button(action, action: perform).font(.system(size: 11, weight: .semibold)).foregroundStyle(VFColor.forest)
            }
        }
    }

    private func eyebrow(_ text: String) -> some View {
        Text(text).font(.system(size: 9, weight: .bold, design: .rounded)).tracking(1.05).foregroundStyle(VFColor.muted)
    }

    private func avatar(_ fellow: Fellow, size: CGFloat = 44) -> some View {
        Text(fellow.initials)
            .font(.system(size: size * 0.28, weight: .bold, design: .rounded))
            .foregroundStyle(VFColor.ink)
            .frame(width: size, height: size)
            .background(fellow.tint, in: Circle())
            .overlay(Circle().stroke(VFColor.paper, lineWidth: 3))
    }

    private func fellowRow(_ fellow: Fellow) -> some View {
        HStack(spacing: 12) {
            avatar(fellow, size: 48)
            VStack(alignment: .leading, spacing: 4) {
                Text(fellow.name).font(.system(size: 14, weight: .bold)).foregroundStyle(VFColor.ink)
                Text(fellow.role).font(.system(size: 11, weight: .medium)).foregroundStyle(VFColor.muted)
                Text(fellow.skills.joined(separator: " · ")).font(.system(size: 10)).foregroundStyle(VFColor.forest)
            }
            Spacer(minLength: 4)
            Button {
                if fellow.id != "elena" { connectedIDs.insert(fellow.id) }
                selectedFellow = fellow
            } label: {
                Text(fellow.id == "elena" ? "Mentor" : connectedIDs.contains(fellow.id) ? "Connected" : "Say hello")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(fellow.id == "elena" ? VFColor.muted : VFColor.forest)
                    .padding(.horizontal, 11).padding(.vertical, 8)
                    .background(.white, in: Capsule())
            }
            .buttonStyle(.plain)
        }
        .padding(13)
        .background(.white.opacity(0.78), in: RoundedRectangle(cornerRadius: 17))
    }

    private func missionCard(_ mission: Mission) -> some View {
        Button { selectedMission = mission } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    eyebrow(mission.phase.uppercased())
                    Spacer()
                    Image(systemName: "arrow.up.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(VFColor.muted)
                }
                Text(mission.title).font(.system(size: 17, weight: .bold, design: .rounded)).foregroundStyle(VFColor.ink)
                HStack(spacing: 6) {
                    Image(systemName: "building.2").font(.system(size: 10))
                    Text(mission.partner).font(.system(size: 11, weight: .medium))
                }.foregroundStyle(VFColor.muted)
                skillPills(mission.skills)
                HStack {
                    Text(joinedMissionIDs.contains(mission.id) ? "In your squad" : "Explore this mission")
                        .font(.system(size: 11, weight: .semibold)).foregroundStyle(VFColor.forest)
                    Spacer()
                    Image(systemName: "arrow.right").font(.system(size: 11, weight: .semibold)).foregroundStyle(VFColor.forest)
                }
                .padding(.top, 2)
            }
            .padding(17)
            .background(.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 19))
        }
        .buttonStyle(.plain)
    }

    private func skillPills(_ skills: [String]) -> some View {
        HStack(spacing: 6) {
            ForEach(skills, id: \.self) { skill in
                Text(skill).font(.system(size: 9, weight: .semibold)).foregroundStyle(VFColor.ink)
                    .padding(.horizontal, 9).padding(.vertical, 6).background(VFColor.paper, in: Capsule())
            }
        }
    }

    private func fellowSheet(_ fellow: Fellow) -> some View {
        VStack(alignment: .leading, spacing: 17) {
            Capsule().fill(VFColor.line).frame(width: 38, height: 4).frame(maxWidth: .infinity).padding(.top, 12)
            HStack(spacing: 14) { avatar(fellow, size: 60); VStack(alignment: .leading, spacing: 4) { Text(fellow.name).font(.system(size: 22, weight: .bold, design: .rounded)); Text(fellow.role).font(.system(size: 12)).foregroundStyle(VFColor.muted) } }
            Text("Part of your Fall 2026 fellowship cohort. Shared skills and roles help squads find the right people for each mission.")
                .font(.system(size: 14)).lineSpacing(4).foregroundStyle(VFColor.muted)
            Text(fellow.school).font(.system(size: 12, weight: .medium)).foregroundStyle(VFColor.ink)
            skillPills(fellow.skills)
            if fellow.id != "elena" {
                Label(connectedIDs.contains(fellow.id) ? "Connection saved in this preview" : "Say hello to start collaborating", systemImage: connectedIDs.contains(fellow.id) ? "checkmark.circle.fill" : "bubble.left")
                    .font(.system(size: 12, weight: .semibold)).foregroundStyle(VFColor.forest).padding(.top, 4)
            }
            Spacer(minLength: 10)
        }
        .padding(.horizontal, 24).padding(.bottom, 22)
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.hidden)
    }

    private func missionSheet(_ mission: Mission) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Capsule().fill(VFColor.line).frame(width: 38, height: 4).frame(maxWidth: .infinity).padding(.top, 12)
            eyebrow(mission.phase.uppercased())
            Text(mission.title).font(.system(size: 26, weight: .bold, design: .rounded)).tracking(-0.6)
            Text(mission.partner).font(.system(size: 13, weight: .semibold)).foregroundStyle(VFColor.forest)
            Text(mission.detail).font(.system(size: 14)).lineSpacing(5).foregroundStyle(VFColor.muted)
            skillPills(mission.skills)
            Button {
                if joinedMissionIDs.contains(mission.id) { joinedMissionIDs.remove(mission.id) }
                else { joinedMissionIDs.insert(mission.id) }
                selectedMission = nil
            } label: {
                Text(joinedMissionIDs.contains(mission.id) ? "Leave this sample squad" : "Join this sample squad")
                    .font(.system(size: 14, weight: .bold)).foregroundStyle(.white)
                    .frame(maxWidth: .infinity).padding(.vertical, 15).background(VFColor.ink, in: Capsule())
            }
            .buttonStyle(.plain)
            Text("In this preview, joining updates the local sample state only.")
                .font(.system(size: 10)).foregroundStyle(VFColor.muted)
            Spacer(minLength: 5)
        }
        .padding(.horizontal, 24).padding(.bottom, 22)
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.hidden)
    }
}

#Preview {
    ContentView()
}
