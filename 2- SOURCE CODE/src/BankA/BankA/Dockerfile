FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/BankA/BankA/BankA.csproj", "."]
COPY ["src/Shared/Shared/Shared.csproj", "../Shared/Shared/"]
RUN dotnet restore
COPY src/BankA/BankA/ .
COPY src/Shared/Shared/ ../Shared/Shared/
RUN dotnet build "BankA.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "BankA.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BankA.dll"]
